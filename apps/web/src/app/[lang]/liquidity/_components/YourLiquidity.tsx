"use client";
import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/orpc/utils/solana";
import { Box, Button, Text } from "@dex-web/ui";
import { convertToDecimal, numberFormatHelper } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useMemo, useState } from "react";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { WithdrawLiquidityModal } from "./WithdrawLiquidityModal";

interface YourLiquidityProps {
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
  const { publicKey } = useWallet();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const tokenA = tokenAAddress || DEFAULT_BUY_TOKEN;
  const tokenB = tokenBAddress || DEFAULT_SELL_TOKEN;
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(tokenA, tokenB);
  const { data: userLiquidity } = useSuspenseQuery(
    tanstackClient.liquidity.getUserLiquidity.queryOptions({
      enabled: !!publicKey,
      input: {
        ownerAddress: publicKey?.toBase58() ?? "",
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      },
    }),
  );

  const { data: tokenXDetails } = useSuspenseQuery(
    tanstackClient.tokens.getTokenDetails.queryOptions({
      input: { address: tokenXAddress },
    }),
  );

  const { data: tokenYDetails } = useSuspenseQuery(
    tanstackClient.tokens.getTokenDetails.queryOptions({
      input: { address: tokenYAddress },
    }),
  );

  const { data: poolDetails } = useSuspenseQuery(
    tanstackClient.pools.getPoolDetails.queryOptions({
      input: {
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      },
    }),
  );

  const { data: poolReserves } = useSuspenseQuery(
    tanstackClient.pools.getPoolReserves.queryOptions({
      input: {
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      },
    }),
  );

  const { data: tokenXPrice } = useSuspenseQuery(
    tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenXAddress,
        quoteCurrency: "USD",
      },
    }),
  );

  const { data: tokenYPrice } = useSuspenseQuery(
    tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenYAddress,
        quoteCurrency: "USD",
      },
    }),
  );

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

    const userLpShare = BigNumber(userLpBalance).dividedBy(
      poolReserves.totalLpSupply,
    );

    const userTokenYAmount = userLpShare
      .multipliedBy(poolReserves.reserveY)
      .toNumber();
    const userTokenXAmount = userLpShare
      .multipliedBy(poolReserves.reserveX)
      .toNumber();

    const tokenAValue = BigNumber(userTokenYAmount).multipliedBy(
      tokenXPrice.price || 0,
    );
    const tokenBValue = BigNumber(userTokenXAmount).multipliedBy(
      tokenYPrice.price || 0,
    );
    const totalUsdValue = tokenAValue.plus(tokenBValue).toNumber();

    return {
      totalUsdValue,
      userLpShare: userLpShare.toNumber(),
      userTokenXAmount,
      userTokenYAmount,
    };
  }, [userLiquidity, poolReserves, tokenXPrice, tokenYPrice, poolDetails]);

  if (!userLiquidity?.hasLiquidity || !poolDetails) {
    return null;
  }

  const pendingYield = "0.00";

  return (
    <div className="mt-4 w-full max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Text.Heading className="text-green-200">Your Liquidity</Text.Heading>
          <Text.Body2 className="text-green-300 uppercase">
            All Positions (1)
          </Text.Body2>
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
