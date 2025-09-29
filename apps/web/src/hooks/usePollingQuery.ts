"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

interface PollingQueryOptions<TData, TError = Error> extends Omit<UseQueryOptions<TData, TError>, "refetchInterval" | "queryKey"> {
  pollingInterval?: number;
  enablePolling?: boolean;
}

export function usePollingQuery<TData, TError = Error>(
  queryKey: (string | number | boolean | null | undefined)[],
  queryFn: () => Promise<TData>,
  options: PollingQueryOptions<TData, TError> = {}
) {
  const {
    pollingInterval = 5000,
    enablePolling = true,
    staleTime = pollingInterval / 2,
    ...restOptions
  } = options;

  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: enablePolling ? pollingInterval : false,
    refetchIntervalInBackground: false,
    staleTime,
    ...restOptions,
  });
}