"use client";

import { usePoolData } from "./usePoolData";

interface UseRealtimePoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: "high" | "critical";
}

export function useRealtimePoolData({
  tokenXMint,
  tokenYMint,
  priority = "high",
}: UseRealtimePoolDataParams) {
  return usePoolData({
    tokenXMint,
    tokenYMint,
    priority,
  });
}