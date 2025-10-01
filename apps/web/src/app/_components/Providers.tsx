"use client";

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PosthogProviderWrapper } from "./PosthogProvider";
import { SolanaProvider } from "./SolanaProvider";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 5 * 60 * 1000,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error && "status" in error && typeof error.status === "number") {
            return error.status >= 500 && failureCount < 2;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <PosthogProviderWrapper>
      <SolanaProvider>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </NuqsAdapter>
      </SolanaProvider>
    </PosthogProviderWrapper>
  );
}
