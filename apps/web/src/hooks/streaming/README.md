# Streaming Data Hooks for DeFi Applications

This package provides real-time data streaming for DeFi applications without useEffect anti-patterns. It leverages React Query's built-in lifecycle management for efficient, type-safe streaming data updates.

## 🎯 Key Features

- **No useEffect Anti-patterns**: Uses React Query for subscription management
- **Progressive Enhancement**: SSE → WebSocket → Polling fallback
- **DeFi-Optimized**: Adaptive refresh rates for trading scenarios
- **Type-Safe**: Full TypeScript support with streaming data types
- **Performance**: Intelligent caching and subscription sharing
- **Drop-in Replacements**: Compatible with existing hook APIs

## 🚀 Quick Start

### Basic Pool Data Streaming

Replace `useRealtimePoolData` with enhanced streaming:

```typescript
import { useEnhancedRealtimePoolData } from "./hooks/streaming";

function PoolComponent({ tokenXMint, tokenYMint }) {
  const { poolDetails, isLoading, isStreaming } = useEnhancedRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  return (
    <div>
      <div>Reserve X: {poolDetails?.tokenXReserve}</div>
      <div>Reserve Y: {poolDetails?.tokenYReserve}</div>
      <div>Streaming: {isStreaming ? "🟢 Live" : "🔴 Offline"}</div>
    </div>
  );
}
```

### Token Account Balance Streaming

Replace `useRealtimeTokenAccounts` with adaptive streaming:

```typescript
import { useEnhancedRealtimeTokenAccounts } from "./hooks/streaming";

function TokenBalanceComponent({ publicKey, tokenAAddress, tokenBAddress, hasRecentTransaction }) {
  const {
    buyTokenAccount,
    sellTokenAccount,
    isStreaming,
    streamType,
  } = useEnhancedRealtimeTokenAccounts({
    publicKey,
    tokenAAddress,
    tokenBAddress,
    hasRecentTransaction, // Automatically adjusts priority
  });

  return (
    <div>
      <div>Buy Balance: {buyTokenAccount?.balance}</div>
      <div>Sell Balance: {sellTokenAccount?.balance}</div>
      <div>Stream Type: {streamType}</div>
    </div>
  );
}
```

## 📊 Streaming Configurations

### Priority Levels

The system uses DeFi-optimized priority levels:

```typescript
const DEFI_STREAM_CONFIGS = {
  critical: {
    refreshInterval: 1000,  // 1s - Transaction status
    staleTime: 500,
  },
  high: {
    refreshInterval: 3000,  // 3s - Active trading data
    staleTime: 2000,
  },
  normal: {
    refreshInterval: 10000, // 10s - General pool data
    staleTime: 7000,
  },
  low: {
    refreshInterval: 30000, // 30s - Background monitoring
    staleTime: 25000,
  },
};
```

### Use Cases by Priority

- **Critical**: Transaction status, trade confirmations
- **High**: Active pool reserves, user balances during trading
- **Normal**: General pool data, token prices
- **Low**: Background monitoring, historical data

## 🔄 Migration Guide

### From useRealtimePoolData

```diff
- import { useRealtimePoolData } from "../useRealtimePoolData";
+ import { useEnhancedRealtimePoolData } from "./hooks/streaming";

- const { poolDetails, isLoading } = useRealtimePoolData({
+ const { poolDetails, isLoading, isStreaming } = useEnhancedRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });
```

### From useRealtimeTokenAccounts

```diff
- import { useRealtimeTokenAccounts } from "../useRealtimeTokenAccounts";
+ import { useEnhancedRealtimeTokenAccounts } from "./hooks/streaming";

- const result = useRealtimeTokenAccounts({
+ const result = useEnhancedRealtimeTokenAccounts({
    publicKey,
    tokenAAddress,
    tokenBAddress,
    hasRecentTransaction,
  });

// All existing properties are preserved + new streaming metadata
```

### From Manual Transaction Status

```diff
- import { useTransactionStatus } from "@dex-web/core";
- import { useEffect, useState } from "react";
+ import { useEnhancedTransactionMonitoring } from "./hooks/streaming";

- const [status, setStatus] = useState("pending");
- const { checkTransactionStatus } = useTransactionStatus({...});
-
- useEffect(() => {
-   if (trackingId) {
-     checkTransactionStatus(trackingId, tradeId);
-   }
- }, [trackingId, tradeId]);

+ const {
+   status,
+   isSuccess,
+   isFailed,
+   isStreaming,
+ } = useEnhancedTransactionMonitoring({
+   trackingId,
+   tradeId,
+   onSuccess: (result) => console.log("Success!", result),
+   onFailure: (result) => console.log("Failed!", result),
+ });
```

## 🌐 Server-Sent Events Integration

Enable SSE for maximum performance:

```typescript
const { poolDetails, isStreaming, isFallback } = useStreamingPoolData({
  tokenXMint,
  tokenYMint,
  priority: "high",
  enableSSE: true, // Enable SSE
  enableStreaming: true, // Fallback to polling
});

// Price feeds with SSE (recommended for trading)
const { prices, isStreaming } = useStreamingPriceFeeds({
  symbols: ["SOL", "USDC", "BTC"],
  priority: "high",
  enableSSE: true,
});
```

### SSE Endpoint Requirements

Your backend should provide these endpoints:

```
GET /api/streams/pools/{poolKey}?priority=high
GET /api/streams/token-accounts/{owner}/{mint}?priority=normal
GET /api/streams/transactions/{signature}?tradeId=123
GET /api/streams/prices?symbols=SOL,USDC,BTC&priority=high
```

## 🎛️ Advanced Usage

### Custom Streaming Query

```typescript
import { useStreamingQuery } from "./hooks/streaming";

function useCustomStreamingData() {
  return useStreamingQuery(
    ["custom-data"],
    async () => {
      return await fetchCustomData();
    },
    {
      priority: "normal",
      enableStreaming: true,
    }
  );
}
```

### Multiple Transaction Monitoring

```typescript
import { useStreamingMultipleTransactionStatus } from "./hooks/streaming";

function BatchTransactionComponent({ transactions }) {
  const {
    transactions: results,
    summary,
    isLoading,
  } = useStreamingMultipleTransactionStatus({
    transactions: [
      { trackingId: "tx1", tradeId: "trade1" },
      { trackingId: "tx2", tradeId: "trade2" },
    ],
    enableSSE: true,
  });

  return (
    <div>
      <div>
        Progress: {summary.completed}/{summary.total}
        ({summary.success} success, {summary.failed} failed)
      </div>
      {results.map((tx, i) => (
        <div key={i}>
          Transaction {i + 1}: {tx.status}
        </div>
      ))}
    </div>
  );
}
```

### Real-time Price Feeds

```typescript
import { useStreamingTradingPair } from "./hooks/streaming";

function TradingPairComponent({ tokenA, tokenB }) {
  const {
    tokenA: priceA,
    tokenB: priceB,
    ratio,
    isStreaming,
    lastUpdate,
  } = useStreamingTradingPair({
    tokenA,
    tokenB,
    priority: "high",
    enableSSE: true,
  });

  return (
    <div>
      <div>{tokenA}: ${priceA.price?.toFixed(4)}</div>
      <div>{tokenB}: ${priceB.price?.toFixed(4)}</div>
      <div>Ratio: {ratio.toFixed(6)}</div>
      <div>Last Update: {new Date(lastUpdate).toLocaleTimeString()}</div>
    </div>
  );
}
```

## 🔧 Performance Optimizations

### Subscription Sharing

Multiple components using the same data automatically share subscriptions:

```typescript
const poolA = useStreamingPoolData({ tokenXMint: "SOL", tokenYMint: "USDC" });

const poolB = useStreamingPoolData({ tokenXMint: "SOL", tokenYMint: "USDC" });
```

### Adaptive Refresh Rates

Refresh rates adapt to user activity:

```typescript
const accounts = useStreamingTokenAccounts({
  hasRecentTransaction: true, // 3s intervals
});

const accounts = useStreamingTokenAccounts({
  hasRecentTransaction: false, // 15s intervals
});
```

### Intelligent Caching

React Query's caching prevents unnecessary re-renders and API calls:

- Stale data is served instantly while fresh data loads
- Background updates keep data current
- Failed requests are automatically retried
- Window focus refetches critical data

## 🔍 Debugging

Enable detailed logging:

```typescript
if (process.env.NODE_ENV === "development") {
  window.localStorage.setItem("debug", "streaming:*");
}
```

Monitor streaming status:

```typescript
const { isStreaming, streamType, lastUpdate } = useStreamingPoolData({
  tokenXMint,
  tokenYMint,
});

console.log({
  streaming: isStreaming,
  type: streamType, // "sse", "polling", "websocket"
  age: Date.now() - lastUpdate,
});
```

## 🎯 Best Practices

1. **Use appropriate priorities**: Critical for transactions, high for trading, normal for general data
2. **Enable SSE for real-time trading**: Price feeds and active pool data benefit most
3. **Leverage automatic adaptation**: Let `hasRecentTransaction` adjust refresh rates
4. **Share subscriptions**: Use the same query keys for shared data
5. **Handle loading states**: Always show loading indicators for better UX
6. **Monitor stream health**: Display connection status to users
7. **Graceful degradation**: Always enable polling fallback

## 📈 Performance Comparison

| Metric | Original Polling | Streaming Implementation |
|--------|------------------|-------------------------|
| Pool Data Updates | 10-15s intervals | 3s intervals (high priority) |
| Token Account Updates | 3-15s conditional | 3-10s adaptive |
| Transaction Status | 2s manual polling | 1s auto-streaming |
| Price Feeds | Not implemented | 1-3s real-time |
| Memory Usage | Higher (multiple timers) | Lower (shared subscriptions) |
| Network Efficiency | Lower (redundant requests) | Higher (intelligent caching) |
| User Experience | Delayed updates | Real-time responsiveness |

The streaming implementation provides 3-5x faster updates while using fewer resources through intelligent subscription management and caching.on management and caching.