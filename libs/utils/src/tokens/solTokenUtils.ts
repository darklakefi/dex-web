export const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111111";
export const WSOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111112";

export const SOL_MINTS = [SOL_TOKEN_ADDRESS, WSOL_TOKEN_ADDRESS] as const;

export enum SolTokenType {
  NATIVE_SOL = "NATIVE_SOL",
  WRAPPED_SOL = "WRAPPED_SOL",
  OTHER = "OTHER",
}

export function isSolToken(address: string | null | undefined): boolean {
  if (!address) return false;
  return address === SOL_TOKEN_ADDRESS;
}

export function isWsolToken(address: string | null | undefined): boolean {
  if (!address) return false;
  return address === WSOL_TOKEN_ADDRESS;
}

export function isSolVariant(address: string | null | undefined): boolean {
  if (!address || typeof address !== "string") return false;
  return (SOL_MINTS as readonly string[]).includes(address);
}

export function getSolTokenType(
  address: string | null | undefined,
): SolTokenType {
  if (isSolToken(address)) return SolTokenType.NATIVE_SOL;
  if (isWsolToken(address)) return SolTokenType.WRAPPED_SOL;
  return SolTokenType.OTHER;
}

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

export function getGatewayTokenAddress(
  address: string | null | undefined,
): string {
  if (!address || typeof address !== "string" || address.trim() === "") {
    return "";
  }
  return address.trim();
}

/**
 * Converts token address to the format used by on-chain pools.
 * Pools always use WSOL, never native SOL, so this converts SOL -> WSOL.
 * Use this for pool lookups, PDAs, and on-chain queries.
 */
export function getPoolTokenAddress(
  address: string | null | undefined,
): string {
  if (!address || typeof address !== "string" || address.trim() === "") {
    return "";
  }
  const trimmed = address.trim();
  if (trimmed === SOL_TOKEN_ADDRESS) {
    return WSOL_TOKEN_ADDRESS;
  }
  return trimmed;
}

export function shouldUseNativeSolBalance(
  address: string | null | undefined,
): boolean {
  return isSolToken(address);
}
