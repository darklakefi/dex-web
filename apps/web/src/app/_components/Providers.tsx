"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect, useState } from "react";
import { createQueryClient } from "../../lib/query/client";
import { cleanupPersistedQueries } from "../../lib/query/persister";
import { PosthogProviderWrapper } from "./PosthogProvider";
import { SolanaProvider } from "./SolanaProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  useEffect(() => {
    cleanupPersistedQueries();
  }, []);

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
