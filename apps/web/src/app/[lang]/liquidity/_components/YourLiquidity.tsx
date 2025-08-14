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
    tanstackClient.getUserLiquidity.queryOptions({
      enabled: !!publicKey,
      input: {
        ownerAddress: publicKey?.toBase58() ?? "",
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      },
    }),
  );

  const { data: tokenADetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: tokenAAddress || DEFAULT_BUY_TOKEN },
    }),
  );

  const { data: tokenBDetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: tokenBAddress || DEFAULT_SELL_TOKEN },
    }),
  );

  const { data: poolDetails } = useSuspenseQuery(
    tanstackClient.getPoolDetails.queryOptions({
      input: {
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      },
    }),
  );

  const { data: poolReserves } = useSuspenseQuery(
    tanstackClient.getPoolReserves.queryOptions({
      input: {
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      },
    }),
  );

  const { data: tokenAPrice } = useSuspenseQuery(
    tanstackClient.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenAAddress || DEFAULT_BUY_TOKEN,
        quoteCurrency: "USD",
      },
    }),
  );

  const { data: tokenBPrice } = useSuspenseQuery(
    tanstackClient.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenBAddress || DEFAULT_SELL_TOKEN,
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
        userTokenAAmount: 0,
        userTokenBAmount: 0,
      };
    }

    const userLpBalance = convertToDecimal(
      userLiquidity.lpTokenBalance,
      userLiquidity.decimals,
    );

    const userLpShare = BigNumber(userLpBalance).dividedBy(
      poolReserves.totalLpSupply,
    );

    const userTokenAAmount = userLpShare
      .multipliedBy(poolReserves.reserveY)
      .toNumber();
    const userTokenBAmount = userLpShare
      .multipliedBy(poolReserves.reserveX)
      .toNumber();

    const tokenAValue = BigNumber(userTokenAAmount).multipliedBy(
      tokenAPrice.price || 0,
    );
    const tokenBValue = BigNumber(userTokenBAmount).multipliedBy(
      tokenBPrice.price || 0,
    );
    const totalUsdValue = tokenAValue.plus(tokenBValue).toNumber();

    return {
      totalUsdValue,
      userLpShare: userLpShare.toNumber(),
      userTokenAAmount,
      userTokenBAmount,
    };
  }, [userLiquidity, poolReserves, tokenAPrice, tokenBPrice, poolDetails]);

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
          <div className="flex flex-1 flex-col justify-between gap-2 border-green-500 border-r pr-2">
            <Text.Body2 className="text-green-200">
              {numberFormatHelper({
                decimalScale: 5,
                trimTrailingZeros: true,
                value: liquidityCalculations.userTokenAAmount,
              })}{" "}
              {tokenADetails.symbol}
            </Text.Body2>
            <Text.Body2 className="text-green-200">
              {numberFormatHelper({
                decimalScale: 5,
                trimTrailingZeros: true,
                value: liquidityCalculations.userTokenBAmount,
              })}{" "}
              {tokenBDetails.symbol}
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
        onClose={() => setIsWithdrawModalOpen(false)}
        poolReserves={poolReserves}
        tokenAAddress={tokenAAddress}
        tokenBAddress={tokenBAddress}
        userLiquidity={userLiquidity}
      />
    </div>
  );
}
