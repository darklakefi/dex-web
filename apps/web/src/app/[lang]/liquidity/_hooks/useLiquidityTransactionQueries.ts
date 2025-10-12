import { useAddLiquidityMutation } from "../../../../hooks/mutations/useAddLiquidityMutation";
import { useSubmitAddLiquidity } from "../../../../hooks/mutations/useSubmitAddLiquidity";

/**
 * Manages mutations for liquidity transactions.
 *
 * Provides two mutations:
 * 1. addLiquidityMutation - Creates unsigned transaction (no invalidation needed)
 * 2. submitAddLiquidityMutation - Submits signed transaction (automatically invalidates queries)
 *
 * Following TanStack Query best practices, query invalidations are handled
 * in the mutation's onSuccess callback, not manually by consumers.
 */
export function useLiquidityTransactionQueries() {
  const addLiquidityMutation = useAddLiquidityMutation();
  const submitAddLiquidityMutation = useSubmitAddLiquidity();

  return {
    addLiquidityMutation,
    submitAddLiquidityMutation,
  };
}
