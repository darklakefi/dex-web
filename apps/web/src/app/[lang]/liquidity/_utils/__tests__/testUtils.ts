import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { expect } from "vitest";
import type {
  LiquidityFormValues,
  PoolDetails,
  TokenAccount,
  TokenAccountsData,
  WalletAdapter,
} from "../../_types/liquidity.types";

export const createMockPublicKey = (base58?: string): PublicKey => {
  const defaultKey = "11111111111111111111111111111112";
  return new PublicKey(base58 || defaultKey);
};

export const createMockTokenAccount = (
  overrides?: Partial<TokenAccount>,
): TokenAccount => ({
  address: "token123",
  amount: 1000000,
  decimals: 6,
  mint: "mint123",
  symbol: "TEST",
  ...overrides,
});

export const createMockTokenAccountsData = (
  tokenAccounts?: TokenAccount[],
): TokenAccountsData => ({
  tokenAccounts: tokenAccounts || [createMockTokenAccount()],
});

export const createMockPoolDetails = (
  overrides?: Partial<PoolDetails>,
): PoolDetails => ({
  poolAddress: "pool123",
  price: "1.5",
  tokenXMint: "tokenX123",
  tokenYMint: "tokenY456",
  ...overrides,
});

export const createMockWalletAdapter = (
  overrides?: Partial<WalletAdapter>,
): WalletAdapter => ({
  wallet: {
    adapter: {
      name: "Mock Wallet",
    },
    ...overrides,
  },
});

export const createMockFormValues = (
  overrides?: Partial<LiquidityFormValues>,
): LiquidityFormValues => ({
  initialPrice: "1",
  tokenAAmount: "100",
  tokenBAmount: "200",
  ...overrides,
});

export const TEST_SCENARIOS = {
  DISCONNECTED_WALLET: {
    publicKey: null,
    walletAdapter: null,
  },

  INSUFFICIENT_BALANCE: {
    formValues: createMockFormValues({ tokenAAmount: "1000" }),
    tokenAAccount: createMockTokenAccountsData([
      createMockTokenAccount({ amount: 50, symbol: "SOL" }),
    ]),
  },

  MISSING_POOL: {
    formValues: createMockFormValues(),
    poolDetails: null,
  },
  VALID_TRANSACTION: {
    formValues: createMockFormValues(),
    poolDetails: createMockPoolDetails(),
    publicKey: createMockPublicKey(),
    tokenAAccount: createMockTokenAccountsData([
      createMockTokenAccount({ amount: 2000000, symbol: "SOL" }),
    ]),
    tokenBAccount: createMockTokenAccountsData([
      createMockTokenAccount({ amount: 1000000000, symbol: "USDC" }),
    ]),
    walletAdapter: createMockWalletAdapter(),
  },
} as const;

export const expectValidTransactionPayload = (
  payload: Record<string, unknown>,
) => {
  expect(payload).toHaveProperty("maxAmountX");
  expect(payload).toHaveProperty("maxAmountY");
  expect(payload).toHaveProperty("slippage");
  expect(payload).toHaveProperty("tokenXMint");
  expect(payload).toHaveProperty("tokenYMint");
  expect(payload).toHaveProperty("user");

  expect(typeof payload.maxAmountX).toBe("number");
  expect(typeof payload.maxAmountY).toBe("number");
  expect(typeof payload.slippage).toBe("number");
  expect(typeof payload.tokenXMint).toBe("string");
  expect(typeof payload.tokenYMint).toBe("string");
  expect(typeof payload.user).toBe("string");
};

export const expectValidTokenAccount = (
  tokenAccount: Record<string, unknown>,
) => {
  expect(tokenAccount).toHaveProperty("address");
  expect(tokenAccount).toHaveProperty("amount");
  expect(tokenAccount).toHaveProperty("decimals");
  expect(tokenAccount).toHaveProperty("symbol");

  expect(typeof tokenAccount.address).toBe("string");
  expect(typeof tokenAccount.amount).toBe("number");
  expect(typeof tokenAccount.decimals).toBe("number");
  expect(typeof tokenAccount.symbol).toBe("string");
};

export const mockUtils = {
  convertToDecimal: (amount: number, decimals: number) =>
    new Decimal(amount).div(new Decimal(10).pow(decimals)),
  formatAmountInput: (value: string) => value,
  parseAmount: (amount: string) => Number(amount),
  parseAmountBigNumber: (amount: string) => ({
    gt: (value: number) => Number(amount) > value,
    multipliedBy: (multiplier: string) => ({
      toString: () => (Number(amount) * Number(multiplier)).toString(),
    }),
  }),
  sortSolanaAddresses: (tokenA: string, tokenB: string) => ({
    tokenXAddress: tokenA,
    tokenYAddress: tokenB,
  }),
  validateHasSufficientBalance: ({
    amount,
    tokenAccount,
  }: {
    amount: string;
    tokenAccount: { amount: number; decimals: number };
  }) => {
    if (!tokenAccount) return "No token account";
    const numericAmount = Number(amount);
    const balance = tokenAccount.amount / 10 ** tokenAccount.decimals;
    return numericAmount > balance ? "Insufficient balance" : undefined;
  },
};
