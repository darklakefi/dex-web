import { Connection } from "@solana/web3.js";
import { createHelius, type HeliusClient } from "helius-sdk";

type HeliusClientWithConnection = HeliusClient & {
  connection: Connection;
  endpoint: string;
};

let cachedHelius: HeliusClientWithConnection | undefined;

export function getHelius(): HeliusClientWithConnection {
  if (cachedHelius) {
    return cachedHelius;
  }

  const apiKey = process.env.HELIUS_API_KEY;
  const network =
    process.env.NEXT_PUBLIC_NETWORK === "2" ? "devnet" : "mainnet";

  if (!apiKey) {
    throw new Error("HELIUS_API_KEY is not set");
  }

  const endpoint = `https://${network}.helius-rpc.com/?api-key=${apiKey}`;
  const helius = createHelius({ apiKey, network });

  cachedHelius = Object.assign(helius, {
    connection: new Connection(endpoint, "confirmed"),
    endpoint,
  });

  return cachedHelius;
}
