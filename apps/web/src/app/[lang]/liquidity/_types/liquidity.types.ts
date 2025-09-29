import type { PublicKey } from "@solana/web3.js";

export interface TokenAccount {
  address: string;
  amount: number;
  decimals: number;
  symbol: string;
}

export interface TokenAccountsData {
  tokenAccounts: TokenAccount[];
}

export interface PoolDetails {
  poolAddress?: string;
  tokenXMint: string;
  tokenYMint: string;
  price?: string;
}

export interface LiquidityFormValues {
  initialPrice: string;
  tokenAAmount: string;
  tokenBAmount: string;
}

export interface WalletAdapter {
  wallet: any;
}

export interface LiquidityComponentProps {
  publicKey: PublicKey | null;
  walletAdapter: WalletAdapter | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  poolDetails: PoolDetails | null;
  buyTokenAccount: TokenAccountsData | undefined;
  sellTokenAccount: TokenAccountsData | undefined;
}

export interface TransactionError {
  message: string;
  context?: Record<string, any>;
}

export type LiquidityState = "editing" | "submitting" | "success" | "error";

export interface AmountChangeEvent {
  target: { value: string };
  isTrusted?: boolean;
}