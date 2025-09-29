"use client";

/**
 * Migration examples showing how to replace existing hooks with streaming versions
 *
 * This file demonstrates the transition from polling-based to streaming-based
 * real-time data updates without useEffect anti-patterns.
 */

import type { PublicKey } from "@solana/web3.js";
import {
  useEnhancedRealtimePoolData,
  useEnhancedRealtimeTokenAccounts,
  useStreamingTokenPrice,
  useEnhancedTransactionMonitoring,
} from "./index";

// BEFORE: Original useRealtimePoolData with polling
// ============================================================
// import { useRealtimePoolData } from "../useRealtimePoolData";
//
// function OriginalPoolComponent({ tokenXMint, tokenYMint }) {
//   const { poolDetails, isLoading } = useRealtimePoolData({
//     tokenXMint,
//     tokenYMint,
//   });
//
//   return <div>{poolDetails?.tokenXReserve}</div>;
// }

// AFTER: Enhanced streaming version (drop-in replacement)
// ============================================================
function StreamingPoolComponent({
  tokenXMint,
  tokenYMint
}: {
  tokenXMint: string;
  tokenYMint: string;
}) {
  const { poolDetails, isLoading, isStreaming } = useEnhancedRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  return (
    <div>
      <div>Reserve: {poolDetails?.tokenXReserve}</div>
      <div>Streaming: {isStreaming ? "✅" : "❌"}</div>
    </div>
  );
}

// BEFORE: Original useRealtimeTokenAccounts with conditional polling
// ============================================================
// import { useRealtimeTokenAccounts } from "../useRealtimeTokenAccounts";
//
// function OriginalTokenAccountsComponent({
//   publicKey,
//   tokenAAddress,
//   tokenBAddress,
//   hasRecentTransaction
// }) {
//   const {
//     buyTokenAccount,
//     sellTokenAccount,
//     isRealtime,
//   } = useRealtimeTokenAccounts({
//     publicKey,
//     tokenAAddress,
//     tokenBAddress,
//     hasRecentTransaction,
//   });
//
//   return <div>{buyTokenAccount?.balance}</div>;
// }

// AFTER: Enhanced streaming version with adaptive priority
// ============================================================
function StreamingTokenAccountsComponent({
  publicKey,
  tokenAAddress,
  tokenBAddress,
  hasRecentTransaction,
}: {
  publicKey: PublicKey | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  hasRecentTransaction?: boolean;
}) {
  const {
    buyTokenAccount,
    sellTokenAccount,
    isRealtime,
    isStreaming,
    streamType,
  } = useEnhancedRealtimeTokenAccounts({
    publicKey,
    tokenAAddress,
    tokenBAddress,
    hasRecentTransaction,
  });

  return (
    <div>
      <div>Buy Balance: {buyTokenAccount?.balance}</div>
      <div>Sell Balance: {sellTokenAccount?.balance}</div>
      <div>Streaming: {isStreaming ? "✅" : "❌"} ({streamType})</div>
      <div>Real-time: {isRealtime ? "✅" : "❌"}</div>
    </div>
  );
}

// BEFORE: Manual transaction status checking with useEffect
// ============================================================
// import { useTransactionStatus } from "@dex-web/core";
// import { useEffect, useState } from "react";
//
// function OriginalTransactionComponent({ trackingId, tradeId }) {
//   const [status, setStatus] = useState("pending");
//
//   const { checkTransactionStatus } = useTransactionStatus({
//     checkStatus: async (id, trade) => {
//       // Manual API call
//       return { status: "confirmed" };
//     },
//     successStates: ["confirmed", "finalized"],
//     failStates: ["failed"],
//     onStatusUpdate: (newStatus) => setStatus(newStatus),
//   });
//
//   useEffect(() => {
//     if (trackingId) {
//       checkTransactionStatus(trackingId, tradeId);
//     }
//   }, [trackingId, tradeId]);
//
//   return <div>Status: {status}</div>;
// }

// AFTER: Streaming transaction status without useEffect
// ============================================================
function StreamingTransactionComponent({
  trackingId,
  tradeId,
}: {
  trackingId: string | null;
  tradeId?: string;
}) {
  const {
    status,
    signature,
    confirmations,
    isStreaming,
    isSuccess,
    isFailed,
    isFinalized,
  } = useEnhancedTransactionMonitoring({
    trackingId,
    tradeId,
    onStatusUpdate: (status, attempt) => {
      console.log(`Transaction ${trackingId} status: ${status} (attempt ${attempt})`);
    },
    onSuccess: (result) => {
      console.log("Transaction successful!", result);
    },
    onFailure: (result) => {
      console.log("Transaction failed!", result);
    },
  });

  return (
    <div>
      <div>Status: {status}</div>
      <div>Signature: {signature}</div>
      <div>Confirmations: {confirmations}</div>
      <div>Streaming: {isStreaming ? "✅" : "❌"}</div>
      <div>
        State: {isSuccess ? "✅ Success" : isFailed ? "❌ Failed" : "⏳ Pending"}
      </div>
      {isFinalized && <div>🎉 Finalized!</div>}
    </div>
  );
}

// NEW: Real-time price feeds for trading
// ============================================================
function TradingPriceComponent({
  tokenA,
  tokenB,
}: {
  tokenA: string;
  tokenB: string;
}) {
  const {
    tokenA: priceA,
    tokenB: priceB,
    ratio,
    isStreaming,
    isFallback,
    lastUpdate,
  } = useStreamingTradingPair({
    tokenA,
    tokenB,
    priority: "high", // High priority for trading data
    enableSSE: true, // Enable Server-Sent Events
  });

  const timeSinceUpdate = Date.now() - lastUpdate;
  const isStale = timeSinceUpdate > 5000; // 5 seconds

  return (
    <div>
      <div>
        {tokenA}: ${priceA.price?.toFixed(4)}
        <span style={{ color: (priceA.change24h || 0) >= 0 ? "green" : "red" }}>
          ({priceA.change24h?.toFixed(2)}%)
        </span>
      </div>
      <div>
        {tokenB}: ${priceB.price?.toFixed(4)}
        <span style={{ color: (priceB.change24h || 0) >= 0 ? "green" : "red" }}>
          ({priceB.change24h?.toFixed(2)}%)
        </span>
      </div>
      <div>Ratio: {ratio.toFixed(6)}</div>
      <div>
        Stream: {isStreaming ? "🟢 Live" : isFallback ? "🟡 Fallback" : "🔴 Offline"}
      </div>
      {isStale && <div>⚠️ Data may be stale</div>}
    </div>
  );
}

// PERFORMANCE COMPARISON
// ============================================================
/*
 * Polling vs Streaming Performance:
 *
 * 1. POLLING (Original):
 *    - useRealtimePoolData: 10-15s intervals
 *    - useRealtimeTokenAccounts: 3-15s intervals based on activity
 *    - Manual transaction status: 2s intervals with setTimeout
 *    - Price updates: Not implemented
 *
 * 2. STREAMING (Enhanced):
 *    - Pool data: 3s intervals (high priority) with SSE fallback
 *    - Token accounts: 3-10s adaptive intervals with SSE
 *    - Transaction status: 1s intervals (critical priority) with SSE
 *    - Price feeds: 1-3s intervals with SSE for real-time trading
 *
 * BENEFITS:
 * - No useEffect anti-patterns
 * - Better performance with intelligent caching
 * - Progressive enhancement (SSE → Polling → Fallback)
 * - Adaptive refresh rates based on activity
 * - Built-in error handling and reconnection
 * - Type-safe streaming data structures
 */

export {
  StreamingPoolComponent,
  StreamingTokenAccountsComponent,
  StreamingTransactionComponent,
  TradingPriceComponent,
};