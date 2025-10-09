# @dex-web/orpc

RPC client and server procedures for the DEX Web application.

## Overview

This library provides type-safe RPC communication using oRPC. It defines API routes, procedures, and client utilities for communication between the frontend and backend services.

## Contents

- **Client**: Type-safe RPC client with context management
- **Routers**: API endpoint definitions and procedure handlers
- **Query Keys**: TanStack Query integration and cache key management
- **Utils**: Batch client utilities for optimized requests

## Key Exports

```typescript
import { client, tanstackClient, createClientWithContext, appRouter, rpcHandler, tokenQueryKeys, QUERY_CONFIG, batchClients, createBatchClient } from "@dex-web/orpc";
```

## Usage

```typescript
// Create a client with context
const rpcClient = createClientWithContext({ userId: "123" });

// Use with TanStack Query
const { data } = useQuery({
  queryKey: tokenQueryKeys.all,
  queryFn: () => tanstackClient.tokens.getAll(),
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
2. Add query keys to `lib/queryKeys.ts` if needed
3. Export from `src/index.ts`
4. Write comprehensive tests including success and error cases
5. Document expected input/output types
