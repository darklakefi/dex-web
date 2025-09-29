import { PublicKey } from "@solana/web3.js";

export function sortSolanaAddresses(
  addrA: string,
  addrB: string
): { tokenXAddress: string; tokenYAddress: string } {
  try {
    const aKey = new PublicKey(addrA);
    const bKey = new PublicKey(addrB);

    const comparison = aKey.toBuffer().compare(bKey.toBuffer());

    return comparison > 0
      ? { tokenXAddress: addrB, tokenYAddress: addrA }
      : { tokenXAddress: addrA, tokenYAddress: addrB };
  } catch (error) {
    throw new Error(`Invalid public key input: ${addrA} or ${addrB} is not a valid Solana public key`);
  }
}