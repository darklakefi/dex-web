/**
 * SOL and WSOL token utilities
 *
 * This module provides constants and utility functions for handling
 * native SOL vs wrapped SOL (WSOL) tokens in the application.
 */

export const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111111";
export const WSOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111112";

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
  if (!address || typeof address !== "string") return false;
  return (SOL_MINTS as readonly string[]).includes(address);
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
 *
 * This function ensures that token addresses are properly formatted
 * for gateway communication. Currently, all token addresses (including
 * SOL and WSOL) are sent as-is to the gateway.
 *
 * @param address - The token mint address
 * @returns The address to send to the gateway, or empty string if invalid
 */
export function getGatewayTokenAddress(
  address: string | null | undefined,
): string {
  if (!address || typeof address !== "string" || address.trim() === "") {
    return "";
  }

  return address.trim();
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
