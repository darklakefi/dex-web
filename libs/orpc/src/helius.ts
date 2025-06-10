import { Helius } from "helius-sdk";

if (!process.env.HELIUS_API_KEY) {
  throw new Error("HELIUS_API_KEY is not set");
}

export const helius = new Helius(process.env.HELIUS_API_KEY);
