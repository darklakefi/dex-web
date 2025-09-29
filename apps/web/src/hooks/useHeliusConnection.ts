"use client";

import { Connection } from "@solana/web3.js";
import { logger } from "../utils/logger";

export function useHeliusConnection() {
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
  const network = process.env.NEXT_PUBLIC_NETWORK === "2" ? "devnet" : "mainnet-beta";

  if (!apiKey) {
    logger.warn("NEXT_PUBLIC_HELIUS_API_KEY not found, falling back to public RPC");
    const fallbackUrl = network === "devnet"
      ? "https:
      : "https:
    return new Connection(fallbackUrl, "confirmed");
  }

  const heliusUrl = `https:
  return new Connection(heliusUrl, "confirmed");
}