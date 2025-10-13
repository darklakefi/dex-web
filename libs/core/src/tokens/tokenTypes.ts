/**
 * Core token type definitions for SOL/WSOL handling
 */

/**
 * Token type enum for SOL variants
 */
export enum SolTokenType {
  NATIVE_SOL = "NATIVE_SOL",
  WRAPPED_SOL = "WRAPPED_SOL",
  OTHER = "OTHER",
}

/**
 * Extended token interface that includes SOL variant information
 */
export interface TokenWithSolType {
  address: string;
  symbol: string;
  name?: string;
  decimals: number;
  solTokenType: SolTokenType;
  imageUrl?: string;
}

/**
 * Balance information with SOL-specific handling
 */
export interface TokenBalance {
  address: string;
  amount: number;
  decimals: number;
  symbol: string;
  /** Whether this balance represents native SOL (vs token account balance) */
  isNativeSolBalance: boolean;
}

/**
 * Token account data with SOL variant awareness
 */
export interface EnhancedTokenAccount {
  address: string;
  amount: number;
  decimals: number;
  mint: string;
  symbol: string;
  /** The type of SOL token (native, wrapped, or other) */
  solTokenType: SolTokenType;
  /** Whether this account represents native SOL balance */
  isNativeSol: boolean;
}
