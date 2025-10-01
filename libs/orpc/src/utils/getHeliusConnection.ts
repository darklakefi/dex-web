import { Connection } from "@solana/web3.js";

export function getHeliusConnection() {
  return new Connection(
    `https://${process.env.NEXT_PUBLIC_NETWORK === "2" ? "devnet" : "mainnet"}.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
  );
}
