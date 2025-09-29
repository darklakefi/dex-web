import { Helius } from "helius-sdk";

export function getHelius(): Helius {
  const apiKey = process.env.HELIUS_API_KEY;
  const network =
    process.env.NEXT_PUBLIC_NETWORK === "2" ? "devnet" : "mainnet-beta";

  if (!apiKey) {
    throw new Error("HELIUS_API_KEY is not set");
  }

  return new Helius(apiKey, network);
}
