"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFirstConnectedWalletAddress } from "../app/_utils/getFirstConnectedWalletAddress";
import { queryKeys } from "../lib/queryKeys";

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
    queryKey: [...queryKeys.wallet.address(), wallet?.adapter?.name],
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
    queryKey: [...queryKeys.wallet.publicKey(), publicKey?.toString()],
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
      ...queryKeys.wallet.connection(),
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
    queryKey: [...queryKeys.wallet.adapter(), wallet?.adapter?.name],
    staleTime: 30 * 60 * 1000,
  });
}

export function useInvalidateWalletCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAdapter: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.adapter() }),
    invalidateAddress: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.address() }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all }),
    invalidateConnection: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.wallet.connection(),
      }),
    invalidatePublicKey: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.publicKey() }),
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
