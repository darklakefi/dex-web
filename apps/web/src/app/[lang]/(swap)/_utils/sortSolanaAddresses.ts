import { PublicKey } from "@solana/web3.js";

export function sortSolanaAddresses(
  addrA: string,
  addrB: string,
): { tokenXAddress: string; tokenYAddress: string } {
  const aKey = new PublicKey(addrA);
  const bKey = new PublicKey(addrB);

  const comparison = aKey.toBuffer().compare(bKey.toBuffer());

  return comparison > 0
    ? { tokenXAddress: addrB, tokenYAddress: addrA }
    : { tokenXAddress: addrA, tokenYAddress: addrB };
}
