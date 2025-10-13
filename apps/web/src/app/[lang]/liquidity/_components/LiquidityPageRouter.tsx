"use client";

import type { GetTokenPriceOutput } from "@dex-web/orpc/schemas/index";
import { sortSolanaAddresses } from "@dex-web/utils";
import { Suspense, useMemo } from "react";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { SkeletonForm } from "../../../_components/SkeletonForm";
import { EMPTY_TOKEN } from "../../../_utils/constants";
import { CreatePoolForm } from "./CreatePoolForm";
import { LiquidityForm } from "./LiquidityForm";

interface LiquidityPageRouterProps {
  isCreatePoolMode: boolean;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  tokenPrices: Record<string, GetTokenPriceOutput | undefined>;
}

/**
 * Smart router that decides which form to show based on pool existence.
 *
 * Logic:
 * - If in create pool mode but pool exists -> show LiquidityForm
 * - If in create pool mode and no pool -> show CreatePoolForm
 * - If not in create pool mode -> show LiquidityForm
 *
 * This ensures that when users switch tokens, they automatically see
 * the correct form based on whether a pool exists.
 */
export function LiquidityPageRouter({
  isCreatePoolMode,
  tokenAAddress,
  tokenBAddress,
  tokenPrices,
}: LiquidityPageRouterProps) {
  const isMissingTokens =
    !tokenAAddress ||
    !tokenBAddress ||
    tokenAAddress === EMPTY_TOKEN ||
    tokenBAddress === EMPTY_TOKEN;

  const { tokenXAddress, tokenYAddress } = useMemo(() => {
    if (isMissingTokens) {
      return { tokenXAddress: "", tokenYAddress: "" };
    }
    try {
      return sortSolanaAddresses(tokenAAddress, tokenBAddress);
    } catch {
      return { tokenXAddress: "", tokenYAddress: "" };
    }
  }, [isMissingTokens, tokenAAddress, tokenBAddress]);

  const shouldCheckPool = isCreatePoolMode && !isMissingTokens;

  const { data: poolDetails } = useRealtimePoolData({
    priority: "high",
    tokenXMint: tokenXAddress,
    tokenYMint: tokenYAddress,
  });

  const shouldShowCreatePool =
    isCreatePoolMode && (!shouldCheckPool || !poolDetails);

  return (
    <Suspense fallback={<SkeletonForm type="liquidity" />}>
      {shouldShowCreatePool ? (
        <CreatePoolForm tokenPrices={tokenPrices} />
      ) : (
        <LiquidityForm tokenPrices={tokenPrices} />
      )}
    </Suspense>
  );
}
