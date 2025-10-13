#!/usr/bin/env node

const readline = require("node:readline");

const PROMPTS = {
  architecture: {
    content: `# Architecture Overview

This is a Solana DEX built as an NX monorepo with Next.js 15 App Router.

## Project Structure
- \`apps/web/\` - Main Next.js application (App Router)
- \`libs/core/\` - Core utilities, hooks, constants, schemas
- \`libs/db/\` - Drizzle ORM schemas and database utilities
- \`libs/orpc/\` - oRPC client/server for application data
- \`libs/grpc-client/\` - gRPC client for blockchain operations
- \`libs/ui/\` - Shared UI components (Storybook)
- \`libs/utils/\` - Utility functions
- \`libs/proto-definitions/\` - Protocol Buffer definitions

## API Communication Rules
- **oRPC**: Use for application data (token lists, pool info) via TanStack Query
- **gRPC**: Use for blockchain transactions and critical operations
- **NEVER** use direct \`fetch\` calls - must use typed clients

## State Management Hierarchy
1. **TanStack Query**: ALL server state (never use useState/useEffect for fetching)
2. **TanStack Form**: ALL form state and validation
3. **XState**: ONLY for complex multi-step workflows (e.g., transaction lifecycle)

## Library Boundaries
- All imports from libs must go through \`index.ts\` public API
- Shared logic MUST be in \`libs/\`, not \`apps/web\`
- Components should compose from libraries`,
    description: "Project architecture and patterns for this Solana DEX",
    name: "architecture",
  },
  "coding-standards": {
    content: `# Coding Standards

## Formatting (Biome)
- 2-space indentation
- Double quotes
- Semicolons required
- LF line endings
- 80 char line width (100 for page.tsx/layout.tsx)
- Run: \`pnpm format\`

## Naming Conventions
- Components: \`PascalCase\`
- Hooks: \`useCamelCase\`
- Utilities: \`camelCase\`
- Constants: \`UPPER_SNAKE_CASE\`

## File Organization
- Co-locate tests in \`__tests__/\` with \`*.test.ts(x)\` suffix
- Mocks in \`__mocks__/\`
- Stories: \`*.stories.tsx\`

## TypeScript
- Strict mode enabled
- No unchecked indexed access
- Verbatim module syntax
- No explicit \`any\` in tests (allowed)

## Import Rules
- Use path aliases from tsconfig.base.json
- Library imports must use public API (\`index.ts\`)
- No circular dependencies`,
    description: "Coding standards and conventions",
    name: "coding-standards",
  },
  commands: {
    content: `# Development Commands

## Core Commands
- \`pnpm start\` - Start Next.js dev server (port 4200)
- \`pnpm build\` - Build for production
- \`pnpm test\` - Run Vitest unit tests
- \`pnpm test -- --watch\` - Interactive test mode
- \`pnpm e2e\` - Run Playwright E2E tests
- \`pnpm format\` - Format code with Biome
- \`pnpm lint\` - Lint with Biome

## Database Commands
- \`pnpm db:migrate\` - Apply database migrations
- \`pnpm db:seed\` - Seed database with sample data
- \`pnpm db:studio\` - Open Drizzle Studio (port 4983)
- \`pnpm db:generate\` - Generate migration files

## Monorepo Commands
- \`pnpm dep-graph\` - Visualize dependencies
- \`pnpm affected:test\` - Test affected projects
- \`pnpm affected:build\` - Build affected projects
- \`pnpm knip\` - Find unused code/dependencies

## Proto/gRPC
- \`npx nx run proto-definitions:generate\` - Regenerate gRPC types

## Commit Guidelines
- Use Conventional Commits format
- All commits must be GPG/SSH signed
- Run \`pnpm format\` before committing
- Lefthook runs pre-commit checks`,
    description: "Development commands and workflow",
    name: "commands",
  },
  "common-patterns": {
    content: `# Common Patterns

## Data Fetching (oRPC + TanStack Query)
\`\`\`typescript
import { useQuery } from '@tanstack/react-query';
import { orpcClient } from '@dex-web/orpc';

export function usePoolData(poolId: string) {
  return useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => orpcClient.pool.getById({ id: poolId }),
  });
}
\`\`\`

## Blockchain Actions (gRPC)
\`\`\`typescript
import { grpcClient } from '@dex-web/grpc-client';

const result = await grpcClient.swap({
  inputToken,
  outputToken,
  amount,
});
\`\`\`

## UI Components
\`\`\`typescript
import { Button, Modal } from '@dex-web/ui';
\`\`\`

## Styling (Tailwind + CVA)
\`\`\`typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      primary: 'primary-classes',
      secondary: 'secondary-classes',
    },
  },
});
\`\`\``,
    description: "Common code patterns and examples",
    name: "common-patterns",
  },
  i18n: {
    content: `# i18n Implementation

Framework: next-intl
Languages: English (en), French (fr)
Files: \`/apps/web/locale/{lang}.json\`
Routing: Dynamic \`[lang]\` parameter, locale prefix 'as-needed'

## Client Components
\`\`\`typescript
"use client";
import { useTranslations } from "next-intl";

export function Component() {
  const t = useTranslations("namespace");
  return <div>{t("key")}</div>;
}
\`\`\`

## Server Components
\`\`\`typescript
import { getTranslations } from "next-intl/server";

export async function Component() {
  const t = await getTranslations("namespace");
  return <div>{t("key")}</div>;
}
\`\`\`

## Dynamic Values
\`\`\`typescript
t("message", { name: "Alice" })
\`\`\`

## BUTTON_MESSAGE Pattern
\`\`\`typescript
const BUTTON_MESSAGE = {
  ENTER_AMOUNT: t("enterAmount"),
  LOADING: tCommon("loading"),
  HIGH_PRICE_IMPACT: (value: string) => t("highPriceImpact", { value })
};
\`\`\``,
    description: "Internationalization patterns with next-intl",
    name: "i18n",
  },
  solana: {
    content: `# Solana Integration

## Key Dependencies
- \`@solana/web3.js\` - Solana web3 SDK
- \`@solana/spl-token\` - SPL token utilities
- \`@solana/wallet-adapter-*\` - Wallet integration
- \`@coral-xyz/anchor\` - Anchor framework
- \`@metaplex-foundation/*\` - Token metadata

## Wallet Connection
- Component: \`apps/web/src/app/_components/SelectWalletModal.tsx\`
- Providers configured for Solana wallet adapters

## Token Operations
- Use gRPC client for swaps, liquidity operations
- Token data fetched via oRPC
- Token selection: \`SelectTokenModal.tsx\`

## Environment Variables
- \`NEXT_PUBLIC_NETWORK\` - Solana network (1=mainnet, 2=devnet)
- \`NEXT_PUBLIC_EXPLORER_URL\` - Solana Explorer URL
- \`EXCHANGE_PROGRAM_ID\` - Program ID for DEX
- \`HELIUS_API_KEY\` - Helius RPC API key

## Transaction Handling
- Use XState for transaction lifecycle
- Show transaction status with toast notifications (sonner)
- Transaction history tracked in database`,
    description: "Solana/Web3 specific patterns",
    name: "solana",
  },
  "state-management": {
    content: `# State Management Hierarchy

## 1. TanStack Query - Server State
Use for ALL server state. Never use useState/useEffect for data fetching.

\`\`\`typescript
import { useQuery } from '@tanstack/react-query';
import { orpcClient } from '@dex-web/orpc';

export function usePoolData(poolId: string) {
  return useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => orpcClient.pool.getById({ id: poolId }),
  });
}
\`\`\`

## 2. TanStack Form - Form State
Use for ALL form state and validation.

\`\`\`typescript
import { useForm } from '@tanstack/react-form';

const form = useForm({
  defaultValues: { amount: '' },
  onSubmit: async ({ value }) => {},
});
\`\`\`

## 3. XState - Complex Workflows
Reserved ONLY for complex multi-step workflows.

\`\`\`typescript
const transactionMachine = createMachine({});
\`\`\``,
    description: "State management hierarchy and patterns",
    name: "state-management",
  },
};

class MCPServer {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
  }

  sendResponse(id, result) {
    console.log(JSON.stringify({ id, jsonrpc: "2.0", result }));
  }

  sendError(id, code, message) {
    console.log(
      JSON.stringify({ error: { code, message }, id, jsonrpc: "2.0" }),
    );
  }

  handleInitialize(id) {
    this.sendResponse(id, {
      capabilities: { prompts: {} },
      protocolVersion: "2024-11-05",
      serverInfo: { name: "dex-web-context", version: "1.0.0" },
    });
  }

  handlePromptsList(id) {
    const promptsList = Object.values(PROMPTS).map((p) => ({
      arguments: [],
      description: p.description,
      name: p.name,
    }));
    this.sendResponse(id, { prompts: promptsList });
  }

  handlePromptsGet(id, params) {
    const prompt = PROMPTS[params.name];
    if (!prompt) {
      this.sendError(id, -32602, `Unknown prompt: ${params.name}`);
      return;
    }
    this.sendResponse(id, {
      messages: [
        { content: { text: prompt.content, type: "text" }, role: "user" },
      ],
    });
  }

  handleRequest(line) {
    try {
      const { method, id, params } = JSON.parse(line);
      switch (method) {
        case "initialize":
          this.handleInitialize(id);
          break;
        case "prompts/list":
          this.handlePromptsList(id);
          break;
        case "prompts/get":
          this.handlePromptsGet(id, params);
          break;
        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  start() {
    this.rl.on("line", (line) => this.handleRequest(line));
  }
}

new MCPServer().start();
