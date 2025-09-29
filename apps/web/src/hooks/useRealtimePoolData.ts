"use client";

import { useOptimizedPoolData } from "./useOptimizedPoolData";

interface UseRealtimePoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
}

export function useRealtimePoolData({
  tokenXMint,
  tokenYMint,
}: UseRealtimePoolDataParams) {
  return useOptimizedPoolData({
    tokenXMint,
    tokenYMint,
    priority: "high",
  });
}