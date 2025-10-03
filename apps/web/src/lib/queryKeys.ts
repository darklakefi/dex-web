export const queryKeys = {
  helius: {
    all: ["helius"] as const,
    subscribe: (accountAddress: string) =>
      [...queryKeys.helius.all, "subscribe", accountAddress] as const,
  },
  integrations: {
    all: ["integrations"] as const,
    quote: (
      tokenXMint: string,
      tokenYMint: string,
      amountIn: number,
      isSwapXToY: boolean,
    ) =>
      [
        ...queryKeys.integrations.all,
        "quote",
        tokenXMint,
        tokenYMint,
        amountIn,
        isSwapXToY,
      ] as const,
  },
  liquidity: {
    all: ["liquidity"] as const,
    review: (
      tokenXMint: string,
      tokenYMint: string,
      maxAmountX: number,
      maxAmountY: number,
    ) =>
      [
        ...queryKeys.liquidity.all,
        "review",
        tokenXMint,
        tokenYMint,
        maxAmountX,
        maxAmountY,
      ] as const,
    user: (ownerAddress: string, tokenXMint: string, tokenYMint: string) =>
      [
        ...queryKeys.liquidity.all,
        "user",
        ownerAddress,
        tokenXMint,
        tokenYMint,
      ] as const,
  },
  pools: {
    all: ["pools"] as const,
    details: (tokenXMint: string, tokenYMint: string) =>
      [...queryKeys.pools.all, "details", tokenXMint, tokenYMint] as const,
    pinned: () => [...queryKeys.pools.all, "pinned"] as const,
    reserves: (tokenXMint: string, tokenYMint: string) =>
      [...queryKeys.pools.all, "reserves", tokenXMint, tokenYMint] as const,
  },
  swap: {
    all: ["swap"] as const,
    quote: (
      tokenXMint: string,
      tokenYMint: string,
      amountIn: number,
      isSwapXToY: boolean,
    ) =>
      [
        ...queryKeys.swap.all,
        "quote",
        tokenXMint,
        tokenYMint,
        amountIn,
        isSwapXToY,
      ] as const,
  },
  tokens: {
    accounts: (ownerAddress: string) =>
      [...queryKeys.tokens.all, "accounts", ownerAddress] as const,
    all: ["tokens"] as const,
    custom: () => [...queryKeys.tokens.all, "custom"] as const,
    metadata: (addresses: string[]) =>
      [...queryKeys.tokens.all, "metadata", addresses] as const,
    price: (address: string) =>
      [...queryKeys.tokens.all, "price", address] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    status: (trackingId: string, tradeId?: string) =>
      [...queryKeys.transactions.all, "status", trackingId, tradeId] as const,
    stream: (trackingId: string, tradeId?: string) =>
      [...queryKeys.transactions.all, "stream", trackingId, tradeId] as const,
  },
  wallet: {
    adapter: () => [...queryKeys.wallet.all, "adapter"] as const,
    address: () => [...queryKeys.wallet.all, "address"] as const,
    all: ["wallet"] as const,
    connection: () => [...queryKeys.wallet.all, "connection"] as const,
    publicKey: () => [...queryKeys.wallet.all, "publicKey"] as const,
  },
} as const;
