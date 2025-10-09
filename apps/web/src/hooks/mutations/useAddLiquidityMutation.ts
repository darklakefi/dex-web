"use client";

import { client } from "@dex-web/orpc";
import { useMutation } from "@tanstack/react-query";

export interface AddLiquidityVariables {
  tokenMintX: string;
  tokenMintY: string;
  maxAmountX: bigint;
  maxAmountY: bigint;
  amountLp: bigint;
  userAddress: string;
  label: string;
  refCode: string;
}

export interface AddLiquidityResponse {
  unsignedTransaction: string;
  tradeId?: string;
}

export function useAddLiquidityMutation() {
  return useMutation<AddLiquidityResponse, Error, AddLiquidityVariables>({
    mutationFn: async (variables: AddLiquidityVariables) => {
      const response = await client.dexGateway.addLiquidity(variables);
      return response;
    },
  });
}
