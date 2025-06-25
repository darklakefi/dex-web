"use client";

import { WalletContextProvider } from "@dex-web/ui";
import {
  type Adapter,
  WalletAdapterNetwork,
  type WalletError,
} from "@solana/wallet-adapter-base";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
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

const NETWORK =
  process.env.NETWORK === "mainnet"
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet;

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const onError = (error: WalletError, adapter?: Adapter) => {
    console.log(error, adapter);
  };

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <WalletContextProvider network={NETWORK} onError={onError}>
          {children}
        </WalletContextProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
