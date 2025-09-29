import { vi } from 'vitest';


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
            imageUrl: "https://example.com/mock-token.png",
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


export const mockWalletAdapter = {
  connected: true,
  publicKey: {
    toBase58: () => 'mock-public-key',
  },
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
};


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


vi.mock('@dex-web/utils', () => ({
  sortSolanaAddresses: vi.fn((addrA, addrB) => ({
    tokenXAddress: addrA || 'mock-token-x',
    tokenYAddress: addrB || 'mock-token-y',
  })),
  formatValueWithThousandSeparator: vi.fn((value) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  }),
  convertToDecimal: vi.fn((amount, decimals) => {
    if (typeof amount === 'number' && typeof decimals === 'number') {
      return amount / 10 ** decimals;
    }
    return 0;
  }),
}));

vi.mock('@solana/web3.js', () => ({
  PublicKey: vi.fn().mockImplementation((key) => ({
    toBase58: () => key || 'mock-public-key',
    toString: () => key || 'mock-public-key',
    toBuffer: () => {
      const buffer = Buffer.from(key || 'mock-public-key', 'utf8');
      return {
        compare: (other: Buffer) => buffer.compare(other),
      };
    },
  })),
  Transaction: vi.fn(),
  SystemProgram: {
    transfer: vi.fn(),
  },
}));