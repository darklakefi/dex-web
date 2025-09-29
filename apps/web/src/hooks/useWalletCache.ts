"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirstConnectedWalletAddress } from "../app/_utils/getFirstConnectedWalletAddress";

export const walletQueryKeys = {
  all: ["wallet"] as const,
  address: () => [...walletQueryKeys.all, "address"] as const,
  publicKey: () => [...walletQueryKeys.all, "publicKey"] as const,
  connection: () => [...walletQueryKeys.all, "connection"] as const,
  adapter: () => [...walletQueryKeys.all, "adapter"] as const,
} as const;

export function useWalletAddress() {
  const { wallet } = useWallet();

  return useQuery({
    queryKey: [...walletQueryKeys.address(), wallet?.adapter?.name],
    queryFn: () => {
      if (!wallet?.adapter) return null;
      return getFirstConnectedWalletAddress(wallet.adapter);
    },
    enabled: !!wallet?.adapter,
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useWalletPublicKey() {
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: [...walletQueryKeys.publicKey(), publicKey?.toString()],
    queryFn: () => publicKey,
    enabled: !!publicKey,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useWalletConnection() {
  const { wallet, connected, connecting, disconnecting } = useWallet();

  return useQuery({
    queryKey: [
      ...walletQueryKeys.connection(),
      wallet?.adapter?.name,
      connected,
      connecting,
      disconnecting,
    ],
    queryFn: () => ({
      wallet,
      connected,
      connecting,
      disconnecting,
      isReady: !connecting && !disconnecting,
    }),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useWalletAdapter() {
  const { wallet } = useWallet();

  return useQuery({
    queryKey: [...walletQueryKeys.adapter(), wallet?.adapter?.name],
    queryFn: () => {
      if (!wallet?.adapter) return null;

      return {
        name: wallet.adapter.name,
        icon: wallet.adapter.icon,
        url: wallet.adapter.url,
        readyState: wallet.readyState,
        adapter: wallet.adapter,
        wallet: wallet,
      };
    },
    enabled: !!wallet?.adapter,
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useInvalidateWalletCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all }),
    invalidateAddress: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.address() }),
    invalidatePublicKey: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.publicKey() }),
    invalidateConnection: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.connection() }),
    invalidateAdapter: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.adapter() }),
  };
}

export function useCachedWallet() {
  const {
    wallet,
    disconnect,
    select,
    wallets,
    signTransaction,
    signMessage,
    signAllTransactions,
  } = useWallet();
  const addressQuery = useWalletAddress();
  const publicKeyQuery = useWalletPublicKey();
  const connectionQuery = useWalletConnection();
  const adapterQuery = useWalletAdapter();

  return {
    disconnect,
    select,
    wallets,
    signTransaction,
    signMessage,
    signAllTransactions,

    wallet: connectionQuery.data?.wallet || wallet,
    connected: connectionQuery.data?.connected ?? false,
    connecting: connectionQuery.data?.connecting ?? false,
    disconnecting: connectionQuery.data?.disconnecting ?? false,
    publicKey: publicKeyQuery.data || null,
    address: addressQuery.data || null,
    adapter: adapterQuery.data || null,

    isLoading:
      addressQuery.isLoading ||
      publicKeyQuery.isLoading ||
      connectionQuery.isLoading ||
      adapterQuery.isLoading,
    isError:
      addressQuery.isError ||
      publicKeyQuery.isError ||
      connectionQuery.isError ||
      adapterQuery.isError,
    error:
      addressQuery.error ||
      publicKeyQuery.error ||
      connectionQuery.error ||
      adapterQuery.error,
  };
}
