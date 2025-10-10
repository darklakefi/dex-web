# @dex-web/orpc

RPC client and server procedures for the DEX Web application.

## Overview

This library provides type-safe RPC communication using oRPC. It defines API routes, procedures, and client utilities for communication between the frontend and backend services.

## Contents

- **Client**: Type-safe RPC client with context management
- **Routers**: API endpoint definitions and procedure handlers
- **Query Config**: TanStack Query cache configuration constants
- **Utils**: Batch client utilities for optimized requests

## Key Exports

```typescript
import { client, tanstackClient, createClientWithContext, appRouter, rpcHandler, QUERY_CONFIG, batchClients, createBatchClient } from "@dex-web/orpc";
```

## Usage

```typescript
// Create a client with context
const rpcClient = createClientWithContext({ userId: "123" });

// Use with TanStack Query - oRPC provides built-in query key generation
const { data } = useQuery({
  ...tanstackClient.tokens.getTokenMetadata.queryOptions({
    input: { address: "token-address" },
  }),
  // Optional: override cache config
  gcTime: QUERY_CONFIG.tokenMetadata.gcTime,
});

// Invalidate queries using oRPC's key helpers
queryClient.invalidateQueries({
  queryKey: tanstackClient.tokens.getTokenMetadata.key(),
});
```

## Development

```bash
# Build the library
pnpm nx build orpc

# Run tests
pnpm nx test orpc

# Lint
pnpm nx lint orpc
```

## Testing

Run tests with Vitest:

```bash
pnpm nx test orpc
```

## Contributing

When adding new RPC procedures:

1. Define procedure in appropriate router file
2. Use oRPC's built-in query key generation (`.key()`, `.queryKey()`, etc.)
3. Export from `src/index.ts`
4. Write comprehensive tests including success and error cases
5. Document expected input/output types
