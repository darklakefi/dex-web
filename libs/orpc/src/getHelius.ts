import { Helius } from "helius-sdk";

export function getHelius(): Helius {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error("HELIUS_API_KEY is not set");
  }

  return new Helius(
    apiKey,
    process.env.NETWORK === "2" ? "devnet" : "mainnet-beta",
  );
}
