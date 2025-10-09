import { PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { EXCHANGE_PROGRAM_ID, getLpTokenMint } from "../getLpTokenMint";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WSOL = "So11111111111111111111111111111111111111112";

describe("getLpTokenMint", () => {
  it("should derive LP token mint for valid token pair", async () => {
    const lpMint = await getLpTokenMint(USDC, WSOL);

    expect(lpMint).toBeInstanceOf(PublicKey);
    expect(lpMint.toBase58()).toBeTruthy();
    expect(lpMint.toBase58().length).toBe(44);
  });

  it("should return same LP mint regardless of input order", async () => {
    const lpMint1 = await getLpTokenMint(USDC, WSOL);
    const lpMint2 = await getLpTokenMint(WSOL, USDC);

    expect(lpMint1.toBase58()).toBe(lpMint2.toBase58());
  });

  it("should handle same token twice", async () => {
    const lpMint = await getLpTokenMint(USDC, USDC);

    expect(lpMint).toBeInstanceOf(PublicKey);
    expect(lpMint.toBase58()).toBeTruthy();
  });

  it("should use EXCHANGE_PROGRAM_ID constant", async () => {
    expect(EXCHANGE_PROGRAM_ID).toBeInstanceOf(PublicKey);
    expect(EXCHANGE_PROGRAM_ID.toBase58()).toBeTruthy();
  });

  it("should derive deterministic LP mint for token pair", async () => {
    const lpMint1 = await getLpTokenMint(USDC, WSOL);
    const lpMint2 = await getLpTokenMint(USDC, WSOL);

    expect(lpMint1.toBase58()).toBe(lpMint2.toBase58());
  });

  it("should throw error for invalid token addresses", async () => {
    await expect(getLpTokenMint("invalid", WSOL)).rejects.toThrow();
    await expect(getLpTokenMint(USDC, "invalid")).rejects.toThrow();
  });
});
