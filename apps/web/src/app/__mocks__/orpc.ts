import { vi } from "vitest";

export const mockTanstackClient = {
  liquidity: {
    createLiquidityTransaction: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(() =>
        Promise.resolve({ signature: "mock-signature" }),
      ),
    },
  },
  pools: {
    getPoolDetails: {
      queryOptions: vi.fn(() => ({
        queryFn: () =>
          Promise.resolve({
            poolAddress: "mock-pool-address",
            price: "1.5",
            tokenXMint: "mock-token-x",
            tokenYMint: "mock-token-y",
          }),
        queryKey: ["poolDetails", "mock-pool"],
        staleTime: 10000,
      })),
    },
  },
  tokens: {
    getTokenMetadata: {
      queryOptions: vi.fn(() => ({
        queryFn: () =>
          Promise.resolve({
            "mock-token": {
              imageUrl: "https://example.com/mock-token.png",
              name: "Mock Token",
              symbol: "MOCK",
            },
          }),
        queryKey: ["tokenMetadata", ["mock-token"]],
        staleTime: 5000,
      })),
    },
    getTokenPrice: {
      queryOptions: vi.fn(() => ({
        queryFn: () => Promise.resolve({ price: 1.5 }),
        queryKey: ["tokenPrice", "mock-token"],
        staleTime: 5000,
      })),
    },
  },
};

export const mockWalletAdapter = {
  connected: true,
  publicKey: {
    toBase58: () => "mock-public-key",
  },
  signAllTransactions: vi.fn(),
  signTransaction: vi.fn(),
};

vi.mock("@dex-web/orpc", () => ({
  tanstackClient: mockTanstackClient,
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({
    connection: {
      confirmTransaction: vi.fn(() =>
        Promise.resolve({ value: { err: null } }),
      ),
      getLatestBlockhash: vi.fn(() =>
        Promise.resolve({ blockhash: "mock-blockhash" }),
      ),
    },
  }),
  useWallet: () => mockWalletAdapter,
}));

vi.mock("@dex-web/utils", () => ({
  convertToDecimal: vi.fn((amount, decimals) => {
    if (typeof amount === "number" && typeof decimals === "number") {
      return amount / 10 ** decimals;
    }
    return 0;
  }),
  formatValueWithThousandSeparator: vi.fn((value) => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value;
  }),
  sortSolanaAddresses: vi.fn((addrA, addrB) => ({
    tokenXAddress: addrA || "mock-token-x",
    tokenYAddress: addrB || "mock-token-y",
  })),
}));

vi.mock("@solana/web3.js", () => ({
  PublicKey: vi.fn().mockImplementation((key) => ({
    toBase58: () => key || "mock-public-key",
    toBuffer: () => {
      const buffer = Buffer.from(key || "mock-public-key", "utf8");
      return {
        compare: (other: Buffer) => buffer.compare(other),
      };
    },
    toString: () => key || "mock-public-key",
  })),
  SystemProgram: {
    transfer: vi.fn(),
  },
  Transaction: vi.fn(),
}));
