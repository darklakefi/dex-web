import { PublicKey } from "@solana/web3.js";

export function sortTokenPublicKeys(
  keyA: PublicKey,
  keyB: PublicKey,
): [PublicKey, PublicKey] {
  const comparison = keyA.toBuffer().compare(keyB.toBuffer());
  return comparison <= 0 ? [keyA, keyB] : [keyB, keyA];
}

export function sortSolanaAddresses(
  addrA: string,
  addrB: string,
): { tokenXAddress: string; tokenYAddress: string } {
  try {
    const aKey = new PublicKey(addrA);
    const bKey = new PublicKey(addrB);

    const [sortedA, sortedB] = sortTokenPublicKeys(aKey, bKey);

    return {
      tokenXAddress: sortedA.toBase58(),
      tokenYAddress: sortedB.toBase58(),
    };
  } catch (_error) {
    throw new Error(
      `Invalid public key input: ${addrA} or ${addrB} is not a valid Solana public key`,
    );
  }
}
