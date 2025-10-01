"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirstConnectedWalletAddress } from "../app/_utils/getFirstConnectedWalletAddress";

export const walletQueryKeys = {
  adapter: () => [...walletQueryKeys.all, "adapter"] as const,
  address: () => [...walletQueryKeys.all, "address"] as const,
  all: ["wallet"] as const,
  connection: () => [...walletQueryKeys.all, "connection"] as const,
  publicKey: () => [...walletQueryKeys.all, "publicKey"] as const,
} as const;

export function useWalletAddress() {
  const { wallet } = useWallet();

  return useQuery({
    enabled: !!wallet?.adapter,
    gcTime: 60 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryFn: () => {
      if (!wallet?.adapter) return null;
      return getFirstConnectedWalletAddress(wallet.adapter);
    },
    queryKey: [...walletQueryKeys.address(), wallet?.adapter?.name],
    staleTime: 30 * 60 * 1000,
  });
}

export function useWalletPublicKey() {
  const { publicKey } = useWallet();

  return useQuery({
    enabled: !!publicKey,
    gcTime: 60 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryFn: () => publicKey,
    queryKey: [...walletQueryKeys.publicKey(), publicKey?.toString()],
    staleTime: 30 * 60 * 1000,
  });
}

export function useWalletConnection() {
  const { wallet, connected, connecting, disconnecting } = useWallet();

  return useQuery({
    gcTime: 5 * 60 * 1000,
    queryFn: () => ({
      connected,
      connecting,
      disconnecting,
      isReady: !connecting && !disconnecting,
      wallet,
    }),
    queryKey: [
      ...walletQueryKeys.connection(),
      wallet?.adapter?.name,
      connected,
      connecting,
      disconnecting,
    ],
    staleTime: 1 * 60 * 1000,
  });
}

export function useWalletAdapter() {
  const { wallet } = useWallet();

  return useQuery({
    enabled: !!wallet?.adapter,
    gcTime: 60 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryFn: () => {
      if (!wallet?.adapter) return null;

      return {
        adapter: wallet.adapter,
        icon: wallet.adapter.icon,
        name: wallet.adapter.name,
        readyState: wallet.readyState,
        url: wallet.adapter.url,
        wallet: wallet,
      };
    },
    queryKey: [...walletQueryKeys.adapter(), wallet?.adapter?.name],
    staleTime: 30 * 60 * 1000,
  });
}

export function useInvalidateWalletCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAdapter: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.adapter() }),
    invalidateAddress: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.address() }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all }),
    invalidateConnection: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.connection() }),
    invalidatePublicKey: () =>
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.publicKey() }),
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
    adapter: adapterQuery.data || null,
    address: addressQuery.data || null,
    connected: connectionQuery.data?.connected ?? false,
    connecting: connectionQuery.data?.connecting ?? false,
    disconnect,
    disconnecting: connectionQuery.data?.disconnecting ?? false,
    error:
      addressQuery.error ||
      publicKeyQuery.error ||
      connectionQuery.error ||
      adapterQuery.error,
    isError:
      addressQuery.isError ||
      publicKeyQuery.isError ||
      connectionQuery.isError ||
      adapterQuery.isError,

    isLoading:
      addressQuery.isLoading ||
      publicKeyQuery.isLoading ||
      connectionQuery.isLoading ||
      adapterQuery.isLoading,
    publicKey: publicKeyQuery.data || null,
    select,
    signAllTransactions,
    signMessage,
    signTransaction,

    wallet: connectionQuery.data?.wallet || wallet,
    wallets,
  };
}
