import type { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAddLiquidityMutation } from "../../../../hooks/mutations/useAddLiquidityMutation";
import { queryKeys } from "../../../../lib/queryKeys";
import type { PoolDetails } from "../_types/liquidity.types";

export function useLiquidityTransactionQueries() {
  const queryClient = useQueryClient();
  const addLiquidityMutation = useAddLiquidityMutation();

  const invalidateQueries = useCallback(
    async (walletPublicKey: PublicKey, poolDetails: PoolDetails) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await queryClient.invalidateQueries({
        queryKey: queryKeys.liquidity.user(
          walletPublicKey.toBase58(),
          poolDetails.tokenXMint,
          poolDetails.tokenYMint,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.liquidity.allUserPositions(
          walletPublicKey.toBase58(),
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pools.reserves(
          poolDetails.tokenXMint,
          poolDetails.tokenYMint,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tokens.accounts(walletPublicKey.toBase58()),
      });
    },
    [queryClient],
  );

  return {
    addLiquidityMutation,
    invalidateQueries,
  };
}
