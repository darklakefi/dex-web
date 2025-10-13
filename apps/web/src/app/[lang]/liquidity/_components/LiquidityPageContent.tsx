"use client";

import { useTokenPricesMap } from "../../../../hooks/useTokenPrices";
import { LiquidityPageRouter } from "./LiquidityPageRouter";
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
      <LiquidityPageRouter
        isCreatePoolMode={isCreatePoolMode}
        tokenAAddress={tokenAAddress}
        tokenBAddress={tokenBAddress}
        tokenPrices={tokenPrices}
      />
      <YourLiquidity
        tokenAAddress={tokenAAddress ?? undefined}
        tokenBAddress={tokenBAddress ?? undefined}
        tokenPrices={tokenPrices}
      />
    </>
  );
}
