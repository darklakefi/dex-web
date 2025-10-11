"use client";
import { tanstackClient } from "@dex-web/orpc";
import type { GetTokenPriceOutput, Token } from "@dex-web/orpc/schemas/index";
import { Box, Button, Text } from "@dex-web/ui";
import {
  convertToDecimal,
  numberFormatHelper,
  sortSolanaAddresses,
  truncate,
} from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useState } from "react";
import { useUserLiquidity } from "../../../../hooks/queries/useLiquidityQueries";
import { usePoolReserves } from "../../../../hooks/queries/usePoolQueries";
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
  tokenPrices?: Record<string, GetTokenPriceOutput | undefined>;
}

export function YourLiquidity({
  tokenAAddress,
  tokenBAddress,
  onWithdraw,
  onClaim,
  tokenPrices = {},
}: YourLiquidityProps) {
  const { data: walletPublicKey } = useWalletPublicKey();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const resolvedTokenAAddress = tokenAAddress || DEFAULT_BUY_TOKEN;
  const resolvedTokenBAddress = tokenBAddress || DEFAULT_SELL_TOKEN;

  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    resolvedTokenAAddress,
    resolvedTokenBAddress,
  );

  const shouldFetchLiquidity = !!walletPublicKey;

  const { data: tokenMetadataResponse } = useQuery({
    ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: {
        $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
        filterBy: {
          case: "addressesList" as const,
          value: {
            $typeName: "darklake.v1.TokenAddressesList" as const,
            tokenAddresses: [tokenXAddress, tokenYAddress],
          },
        },
        pageNumber: 1,
        pageSize: 2,
      },
    }),
    enabled: Boolean(tokenXAddress && tokenYAddress),
    gcTime: 5 * 60 * 1000,
    queryKey: tanstackClient.dexGateway.getTokenMetadataList.queryKey({
      input: {
        $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
        filterBy: {
          case: "addressesList" as const,
          value: {
            $typeName: "darklake.v1.TokenAddressesList" as const,
            tokenAddresses: [tokenXAddress, tokenYAddress],
          },
        },
        pageNumber: 1,
        pageSize: 2,
      },
    }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
    staleTime: 60 * 1000,
  });

  const { data: userLiquidity, isFetching: isLiquidityFetching } =
    useUserLiquidity(
      walletPublicKey?.toBase58() ?? "",
      tokenXAddress,
      tokenYAddress,
      { enabled: shouldFetchLiquidity },
    );

  const { data: poolReserves, isFetching: isPoolReservesFetching } =
    usePoolReserves(tokenXAddress, tokenYAddress, {
      enabled: shouldFetchLiquidity,
    });

  const tokenXPrice = tokenPrices[tokenXAddress];
  const tokenYPrice = tokenPrices[tokenYAddress];

  const tokenMetadata = tokenMetadataResponse;

  const tokenMetadataMap: Record<string, Token | undefined> =
    tokenMetadata?.tokens?.reduce(
      (acc, token) => {
        acc[token.address] = {
          address: token.address,
          decimals: token.decimals,
          imageUrl: token.logoUri,
          name: token.name,
          symbol: token.symbol,
        };
        return acc;
      },
      {} as Record<string, Token>,
    ) ?? {};

  const tokenXDetails: Token = tokenMetadataMap[tokenXAddress] ?? {
    address: tokenXAddress,
    decimals: 0,
    symbol: truncate(tokenXAddress),
  };

  const tokenYDetails: Token = tokenMetadataMap[tokenYAddress] ?? {
    address: tokenYAddress,
    decimals: 0,
    symbol: truncate(tokenYAddress),
  };

  let liquidityCalculations = {
    totalUsdValue: 0,
    userLpShare: 0,
    userTokenXAmount: 0,
    userTokenYAmount: 0,
  };

  if (
    userLiquidity?.lpTokenBalance &&
    poolReserves?.exists &&
    poolReserves.totalLpSupply
  ) {
    const userLpBalance = convertToDecimal(
      userLiquidity.lpTokenBalance,
      userLiquidity.decimals,
    );
    const userLpShare = userLpBalance.dividedBy(poolReserves.totalLpSupply);
    const userTokenXAmount = userLpShare.mul(poolReserves.reserveX).toNumber();
    const userTokenYAmount = userLpShare.mul(poolReserves.reserveY).toNumber();

    const tokenXValue = BigNumber(userTokenXAmount).multipliedBy(
      tokenXPrice?.price || 0,
    );
    const tokenYValue = BigNumber(userTokenYAmount).multipliedBy(
      tokenYPrice?.price || 0,
    );

    liquidityCalculations = {
      totalUsdValue: tokenXValue.plus(tokenYValue).toNumber(),
      userLpShare: userLpShare.toNumber(),
      userTokenXAmount,
      userTokenYAmount,
    };
  }

  const isBackgroundFetching = isLiquidityFetching || isPoolReservesFetching;

  const isInitialLoading =
    shouldFetchLiquidity &&
    (isLiquidityFetching || isPoolReservesFetching) &&
    !userLiquidity;

  if (isInitialLoading) {
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

  const hasLiquidity =
    shouldFetchLiquidity &&
    userLiquidity?.hasLiquidity &&
    userLiquidity.lpTokenBalance > 0;

  if (!hasLiquidity) {
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
        tokenXPrice={
          tokenXPrice || { mint: tokenXAddress, price: 0, quoteCurrency: "USD" }
        }
        tokenYAddress={tokenYAddress}
        tokenYDetails={tokenYDetails}
        tokenYPrice={
          tokenYPrice || { mint: tokenYAddress, price: 0, quoteCurrency: "USD" }
        }
        userLiquidity={userLiquidity}
      />
    </div>
  );
}

// Enable why-did-you-render tracking for this component
YourLiquidity.whyDidYouRender = true;
