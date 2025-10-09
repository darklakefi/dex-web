/**
 * Mock implementation of sortSolanaAddresses for testing
 * This version uses simple lexicographic sorting instead of Solana PublicKey validation
 */

export function sortTokenPublicKeys<T>(keyA: T, keyB: T): [T, T] {
  const comparison = String(keyA).localeCompare(String(keyB));
  return comparison <= 0 ? [keyA, keyB] : [keyB, keyA];
}

export function sortSolanaAddresses(
  addrA: string,
  addrB: string,
): { tokenXAddress: string; tokenYAddress: string } {
  const sorted = [addrA, addrB].sort();
  return {
    tokenXAddress: sorted[0] as string,
    tokenYAddress: sorted[1] as string,
  };
}
