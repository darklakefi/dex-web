"use client";

import { tanstackClient } from "@dex-web/orpc";
import type {
  GetTokenMetadataOutput,
  GetTokenPriceOutput,
} from "@dex-web/orpc/schemas/index";
import {
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

export function useTokenMetadata(
  addresses: string[],
  options?: { enabled?: boolean },
): UseQueryResult<GetTokenMetadataOutput> {
  return useQuery({
    ...tanstackClient.tokens.getTokenMetadata.queryOptions({
      input: { addresses, returnAsObject: true },
      ...options,
    }),
    queryKey: queryKeys.tokens.metadata(addresses),
  });
}

export function useTokenMetadataSuspense(
  addresses: string[],
): UseSuspenseQueryResult<GetTokenMetadataOutput> {
  return useSuspenseQuery({
    ...tanstackClient.tokens.getTokenMetadata.queryOptions({
      input: { addresses, returnAsObject: true },
    }),
    queryKey: queryKeys.tokens.metadata(addresses),
  });
}

export function useTokenPrice(
  address: string,
  options?: { enabled?: boolean },
): UseQueryResult<GetTokenPriceOutput> {
  return useQuery({
    ...tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: address,
        quoteCurrency: "USD",
      },
      ...options,
    }),
    queryKey: queryKeys.tokens.price(address),
  });
}

export function useTokenPriceSuspense(
  address: string,
): UseSuspenseQueryResult<GetTokenPriceOutput> {
  return useSuspenseQuery({
    ...tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: address,
        quoteCurrency: "USD",
      },
    }),
    queryKey: queryKeys.tokens.price(address),
  });
}
