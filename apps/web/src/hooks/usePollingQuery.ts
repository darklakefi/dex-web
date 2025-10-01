"use client";

import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

interface PollingQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, "refetchInterval" | "queryKey"> {
  pollingInterval?: number;
  enablePolling?: boolean;
}

export function usePollingQuery<TData, TError = Error>(
  queryKey: (string | number | boolean | null | undefined)[],
  queryFn: () => Promise<TData>,
  options: PollingQueryOptions<TData, TError> = {},
) {
  const {
    pollingInterval = 5000,
    enablePolling = true,
    staleTime = pollingInterval / 2,
    ...restOptions
  } = options;

  return useQuery({
    queryFn,
    queryKey,
    refetchInterval: enablePolling ? pollingInterval : false,
    refetchIntervalInBackground: false,
    staleTime,
    ...restOptions,
  });
}
