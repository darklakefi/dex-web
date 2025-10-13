/**
 * SOL and WSOL token utilities
 *
 * This module provides constants and utility functions for handling
 * native SOL vs wrapped SOL (WSOL) tokens in the application.
 */

// Token addresses
export const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111111";
export const WSOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111112";

// Array of SOL mint addresses for easy checking
export const SOL_MINTS = [SOL_TOKEN_ADDRESS, WSOL_TOKEN_ADDRESS] as const;

/**
 * Token type enum for SOL variants
 */
export enum SolTokenType {
  NATIVE_SOL = "NATIVE_SOL",
  WRAPPED_SOL = "WRAPPED_SOL",
  OTHER = "OTHER",
}

/**
 * Check if a token address is native SOL
 */
export function isSolToken(address: string | null | undefined): boolean {
  if (!address) return false;
  return address === SOL_TOKEN_ADDRESS;
}

/**
 * Check if a token address is wrapped SOL (WSOL)
 */
export function isWsolToken(address: string | null | undefined): boolean {
  if (!address) return false;
  return address === WSOL_TOKEN_ADDRESS;
}

/**
 * Check if a token address is either SOL or WSOL
 */
export function isSolVariant(address: string | null | undefined): boolean {
  if (!address) return false;
  return SOL_MINTS.includes(address as (typeof SOL_MINTS)[number]);
}

/**
 * Get the token type for a given address
 */
export function getSolTokenType(
  address: string | null | undefined,
): SolTokenType {
  if (isSolToken(address)) return SolTokenType.NATIVE_SOL;
  if (isWsolToken(address)) return SolTokenType.WRAPPED_SOL;
  return SolTokenType.OTHER;
}

/**
 * Get the display name for SOL variants
 */
export function getSolTokenDisplayName(
  address: string | null | undefined,
): string {
  const tokenType = getSolTokenType(address);
  switch (tokenType) {
    case SolTokenType.NATIVE_SOL:
      return "SOL";
    case SolTokenType.WRAPPED_SOL:
      return "WSOL";
    default:
      return "";
  }
}

/**
 * Get the appropriate token address to send to the gateway
 * For SOL: returns SOL address
 * For WSOL: returns WSOL address
 * For others: returns the original address
 */
export function getGatewayTokenAddress(
  address: string | null | undefined,
): string {
  if (!address) return "";

  // For SOL and WSOL, return the address as-is since they should be handled differently
  if (isSolVariant(address)) {
    return address;
  }

  return address;
}

/**
 * Determine if native SOL balance should be used for this token
 * Returns true only for native SOL, false for WSOL and other tokens
 */
export function shouldUseNativeSolBalance(
  address: string | null | undefined,
): boolean {
  return isSolToken(address);
}
