"use client";
import type { Token } from "@dex-web/orpc/schemas";
import { Box, Button, Text } from "@dex-web/ui";
import {
  convertToDecimal,
  numberFormatHelper,
  sortSolanaAddresses,
  truncate,
} from "@dex-web/utils";
import BigNumber from "bignumber.js";
import { useMemo, useState } from "react";
import { useUserLiquiditySuspense } from "../../../../hooks/queries/useLiquidityQueries";
import {
  usePoolDetailsSuspense,
  usePoolReservesSuspense,
} from "../../../../hooks/queries/usePoolQueries";
import {
  useTokenMetadataSuspense,
  useTokenPriceSuspense,
} from "../../../../hooks/queries/useTokenQueries";
import { useWalletPublicKey } from "../../../../hooks/useWalletCache";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { WithdrawLiquidityModal } from "./WithdrawLiquidityModal";

export interface YourLiquidityProps {
  tokenAAddress?: string;
  tokenBAddress?: string;
  onWithdraw?: () => void;
  onClaim?: () => void;
}

export function YourLiquidity({
  tokenAAddress,
  tokenBAddress,
  onWithdraw,
  onClaim,
}: YourLiquidityProps) {
  const { data: walletPublicKey } = useWalletPublicKey();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const resolvedTokenAAddress = tokenAAddress || DEFAULT_BUY_TOKEN;
  const resolvedTokenBAddress = tokenBAddress || DEFAULT_SELL_TOKEN;

  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    resolvedTokenAAddress,
    resolvedTokenBAddress,
  );
  const { data: userLiquidity, isFetching: isLiquidityFetching } =
    useUserLiquiditySuspense(
      walletPublicKey?.toBase58() ?? "",
      tokenXAddress,
      tokenYAddress,
    );

  const { data: tokenMetadata } = useTokenMetadataSuspense([
    tokenXAddress,
    tokenYAddress,
  ]);

  const { data: poolDetails, isFetching: isPoolFetching } =
    usePoolDetailsSuspense(tokenXAddress, tokenYAddress);

  const { data: poolReserves, isFetching: isReservesFetching } =
    usePoolReservesSuspense(tokenXAddress, tokenYAddress);

  const { data: tokenXPrice } = useTokenPriceSuspense(tokenXAddress);
  const { data: tokenYPrice } = useTokenPriceSuspense(tokenYAddress);

  const tokenMetadataMap =
    (tokenMetadata as Record<string, Token | undefined>) ?? {};

  const createFallbackTokenDetails = (address: string): Token => ({
    address,
    decimals: 0,
    symbol: truncate(address),
  });

  const tokenXDetails =
    tokenMetadataMap[tokenXAddress] ??
    createFallbackTokenDetails(tokenXAddress);
  const tokenYDetails =
    tokenMetadataMap[tokenYAddress] ??
    createFallbackTokenDetails(tokenYAddress);

  const liquidityCalculations = useMemo(() => {
    if (
      !userLiquidity.hasLiquidity ||
      !poolDetails ||
      !poolReserves ||
      poolReserves.totalLpSupply === 0
    ) {
      return {
        totalUsdValue: 0,
        userLpShare: 0,
        userTokenXAmount: 0,
        userTokenYAmount: 0,
      };
    }

    const userLpBalance = convertToDecimal(
      userLiquidity.lpTokenBalance,
      userLiquidity.decimals,
    );

    const userLpShare = userLpBalance.dividedBy(poolReserves.totalLpSupply);

    const userTokenYAmount = userLpShare.mul(poolReserves.reserveY).toNumber();
    const userTokenXAmount = userLpShare.mul(poolReserves.reserveX).toNumber();

    const tokenYValue = BigNumber(userTokenYAmount).multipliedBy(
      tokenYPrice.price || 0,
    );
    const tokenXValue = BigNumber(userTokenXAmount).multipliedBy(
      tokenXPrice.price || 0,
    );
    const totalUsdValue = tokenYValue.plus(tokenXValue).toNumber();

    return {
      totalUsdValue,
      userLpShare: userLpShare.toNumber(),
      userTokenXAmount,
      userTokenYAmount,
    };
  }, [userLiquidity, poolReserves, tokenXPrice, tokenYPrice, poolDetails]);

  const isBackgroundFetching =
    isLiquidityFetching || isPoolFetching || isReservesFetching;

  if (isBackgroundFetching && !userLiquidity?.hasLiquidity) {
    return (
      <div className="mt-4 w-full max-w-md">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Text.Heading className="text-green-200">
              Your Liquidity
            </Text.Heading>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <Text.Body2 className="text-green-300 uppercase">
                Loading...
              </Text.Body2>
            </div>
          </div>
          <Box className="flex flex-row">
            <div className="flex flex-1 flex-col justify-between gap-2 border-green-500 border-r pr-2">
              <Text.Body2 className="text-green-200">Loading...</Text.Body2>
              <Text.Body2 className="text-green-200">Loading...</Text.Body2>
              <Text.Body2 className="text-green-300">DEPOSIT</Text.Body2>
              <Button
                className="max-w-fit cursor-pointer opacity-50"
                disabled
                variant="secondary"
              >
                WITHDRAW
              </Button>
            </div>
          </Box>
        </div>
      </div>
    );
  }

  if (!userLiquidity?.hasLiquidity || !poolDetails) {
    return <div className="mt-4 w-full max-w-md" />;
  }

  const pendingYield = "0.00";

  return (
    <div className="mt-4 w-full max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Text.Heading className="text-green-200">Your Liquidity</Text.Heading>
          <div className="flex items-center gap-2">
            {isBackgroundFetching && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            )}
            <Text.Body2 className="text-green-300 uppercase">
              All Positions (1)
            </Text.Body2>
          </div>
        </div>

        <Box className="flex flex-row">
          <div className="flex flex-1 flex-col justify-between gap-2 border-green-500 border-r pr-2 only:border-r-0 only:pr-0">
            <Text.Body2 className="text-green-200">
              {numberFormatHelper({
                decimalScale: 5,
                trimTrailingZeros: true,
                value: liquidityCalculations.userTokenXAmount,
              })}{" "}
              {tokenXDetails.symbol}
            </Text.Body2>
            <Text.Body2 className="text-green-200">
              {numberFormatHelper({
                decimalScale: 5,
                trimTrailingZeros: true,
                value: liquidityCalculations.userTokenYAmount,
              })}{" "}
              {tokenYDetails.symbol}
            </Text.Body2>
            <Text.Body2 className="text-green-300">DEPOSIT</Text.Body2>
            <Button
              className="max-w-fit cursor-pointer"
              onClick={() => {
                setIsWithdrawModalOpen(true);
                onWithdraw?.();
              }}
              variant="secondary"
            >
              WITHDRAW
            </Button>
          </div>

          <div className="hidden flex-1 flex-col justify-between pl-2">
            <Text.Body2 className="text-green-200">${pendingYield}</Text.Body2>
            <Text.Body2 className="mb-4 text-green-300">
              PENDING YIELD
            </Text.Body2>
            <Button
              className="max-w-fit cursor-pointer"
              onClick={onClaim}
              variant="secondary"
            >
              CLAIM
            </Button>
          </div>
        </Box>
      </div>

      <WithdrawLiquidityModal
        isOpen={isWithdrawModalOpen}
        liquidityCalculations={{
          totalUsdValue: liquidityCalculations.totalUsdValue,
          userLpShare: liquidityCalculations.userLpShare,
          userTokenXAmount: liquidityCalculations.userTokenXAmount,
          userTokenYAmount: liquidityCalculations.userTokenYAmount,
        }}
        onClose={() => setIsWithdrawModalOpen(false)}
        poolReserves={poolReserves}
        tokenXAddress={tokenXAddress}
        tokenXDetails={tokenXDetails}
        tokenYAddress={tokenYAddress}
        tokenYDetails={tokenYDetails}
        userLiquidity={userLiquidity}
      />
    </div>
  );
}
