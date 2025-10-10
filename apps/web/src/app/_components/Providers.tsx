"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { PosthogProviderWrapper } from "./PosthogProvider";
import { SolanaProvider } from "./SolanaProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <PosthogProviderWrapper>
      <SolanaProvider>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === "development" && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </NuqsAdapter>
      </SolanaProvider>
    </PosthogProviderWrapper>
  );
}
