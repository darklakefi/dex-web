import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

const SolanaAddressSchema = z.string().refine(
  (value) => {
    try {
      // Solana addresses are base58 encoded and typically 32-44 characters long
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
        return false;
      }

      new PublicKey(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Invalid Solana address",
  },
);

export { SolanaAddressSchema };
