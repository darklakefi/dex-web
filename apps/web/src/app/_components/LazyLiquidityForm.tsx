import { client } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";
import type { PoolData } from "../../hooks/usePoolData";
import { LiquidityForm } from "../[lang]/liquidity/_components/LiquidityForm";
import { SkeletonForm } from "./SkeletonForm";

type LazyLiquidityFormProps = {
  tokenAAddress?: string | null;
  tokenBAddress?: string | null;
};

export async function LazyLiquidityForm({
  tokenAAddress,
  tokenBAddress,
}: LazyLiquidityFormProps) {
  const queryClient = new QueryClient();

  if (tokenAAddress && tokenBAddress) {
    try {
      const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
        tokenAAddress,
        tokenBAddress,
      );

      await queryClient.prefetchQuery({
        queryFn: async (): Promise<PoolData | null> => {
          const result = await client.pools.getPoolReserves({
            tokenXMint: tokenXAddress,
            tokenYMint: tokenYAddress,
          });

          if (!result || !result.exists) {
            return null;
          }

          return {
            exists: result.exists,
            lastUpdate: Date.now(),
            lpMint: result.lpMint,
            reserveX: result.reserveX,
            reserveY: result.reserveY,
            tokenXMint: tokenXAddress,
            tokenYMint: tokenYAddress,
            totalLpSupply: result.totalLpSupply,
          };
        },
        queryKey: [
          "pool",
          [tokenXAddress, tokenYAddress].sort().join("-"),
          tokenXAddress,
          tokenYAddress,
        ],
      });
    } catch (error) {
      console.error("Failed to prefetch pool reserves", error);
    }
  }

  const state = dehydrate(queryClient);

  return (
    <HydrationBoundary state={state}>
      <Suspense fallback={<SkeletonForm type="liquidity" />}>
        <LiquidityForm />
      </Suspense>
    </HydrationBoundary>
  );
}
