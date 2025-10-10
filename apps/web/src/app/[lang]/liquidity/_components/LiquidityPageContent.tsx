"use client";

import { Suspense } from "react";
import { useTokenPricesMap } from "../../../../hooks/useTokenPrices";
import { SkeletonForm } from "../../../_components/SkeletonForm";
import { CreatePoolForm } from "./CreatePoolForm";
import { LiquidityForm } from "./LiquidityForm";
import { YourLiquidity } from "./YourLiquidity";

interface LiquidityPageContentProps {
  isCreatePoolMode: boolean;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
}

/**
 * Wrapper component that fetches token prices once and passes them down
 * to child components to avoid duplicate price requests.
 */
export function LiquidityPageContent({
  isCreatePoolMode,
  tokenAAddress,
  tokenBAddress,
}: LiquidityPageContentProps) {
  const { prices: tokenPrices } = useTokenPricesMap([
    tokenAAddress,
    tokenBAddress,
  ]);

  return (
    <>
      {isCreatePoolMode ? (
        <Suspense fallback={<SkeletonForm type="liquidity" />}>
          <CreatePoolForm tokenPrices={tokenPrices} />
        </Suspense>
      ) : (
        <Suspense fallback={<SkeletonForm type="liquidity" />}>
          <LiquidityForm tokenPrices={tokenPrices} />
        </Suspense>
      )}
      <YourLiquidity
        tokenAAddress={tokenAAddress ?? undefined}
        tokenBAddress={tokenBAddress ?? undefined}
        tokenPrices={tokenPrices}
      />
    </>
  );
}
