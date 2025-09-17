import { PublicKey } from "@solana/web3.js";

export const isSolanaAddress = (address: string) => {
  try {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      return false;
    }

    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};