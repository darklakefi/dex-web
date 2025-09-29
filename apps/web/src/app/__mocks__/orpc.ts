import { vi } from 'vitest';

// Mock ORPC client
export const mockTanstackClient = {
  tokens: {
    getTokenPrice: {
      queryOptions: vi.fn(() => ({
        queryKey: ["tokenPrice", "mock-token"],
        queryFn: () => Promise.resolve({ price: 1.5 }),
        staleTime: 5000,
      })),
    },
    getTokenMetadata: {
      queryOptions: vi.fn(() => ({
        queryKey: ["tokenMetadata", ["mock-token"]],
        queryFn: () => Promise.resolve({
          "mock-token": {
            symbol: "MOCK",
            name: "Mock Token",
            imageUrl: "https://example.com/mock.png",
          },
        }),
        staleTime: 5000,
      })),
    },
  },
  pools: {
    getPoolDetails: {
      queryOptions: vi.fn(() => ({
        queryKey: ["poolDetails", "mock-pool"],
        queryFn: () => Promise.resolve({
          poolAddress: 'mock-pool-address',
          tokenXMint: 'mock-token-x',
          tokenYMint: 'mock-token-y',
          price: '1.5',
        }),
        staleTime: 10000,
      })),
    },
  },
  liquidity: {
    createLiquidityTransaction: {
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => Promise.resolve({ signature: 'mock-signature' })),
    },
  },
};

// Mock wallet-related modules
export const mockWalletAdapter = {
  connected: true,
  publicKey: {
    toBase58: () => 'mock-public-key',
  },
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
};

// Setup global ORPC mocks
vi.mock('@dex-web/orpc', () => ({
  tanstackClient: mockTanstackClient,
}));

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWalletAdapter,
  useConnection: () => ({
    connection: {
      getLatestBlockhash: vi.fn(() => Promise.resolve({ blockhash: 'mock-blockhash' })),
      confirmTransaction: vi.fn(() => Promise.resolve({ value: { err: null } })),
    },
  }),
}));

// Mock sortSolanaAddresses to avoid PublicKey.toBuffer issues
vi.mock('@dex-web/utils', () => ({
  sortSolanaAddresses: vi.fn((addrA, addrB) => ({
    tokenXAddress: addrA,
    tokenYAddress: addrB,
  })),
}));

vi.mock('@solana/web3.js', () => ({
  PublicKey: vi.fn().mockImplementation((key) => ({
    toBase58: () => key || 'mock-public-key',
    toString: () => key || 'mock-public-key',
    toBuffer: () => {
      const buffer = Buffer.from(key || 'mock-public-key', 'utf8');
      return {
        compare: (other) => buffer.compare(other),
      };
    },
  })),
  Transaction: vi.fn(),
  SystemProgram: {
    transfer: vi.fn(),
  },
}));