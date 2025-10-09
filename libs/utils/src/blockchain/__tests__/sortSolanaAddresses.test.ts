import { PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import {
  sortSolanaAddresses,
  sortTokenPublicKeys,
} from "../sortSolanaAddresses";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WSOL = "So11111111111111111111111111111111111111112";

describe("sortTokenPublicKeys", () => {
  it("should sort token public keys in canonical order", () => {
    const usdcKey = new PublicKey(USDC);
    const wsolKey = new PublicKey(WSOL);

    const [first, second] = sortTokenPublicKeys(usdcKey, wsolKey);

    const comparison = usdcKey.toBuffer().compare(wsolKey.toBuffer());
    if (comparison <= 0) {
      expect(first.toBase58()).toBe(USDC);
      expect(second.toBase58()).toBe(WSOL);
    } else {
      expect(first.toBase58()).toBe(WSOL);
      expect(second.toBase58()).toBe(USDC);
    }
  });

  it("should return same order when keys are equal", () => {
    const key = new PublicKey(USDC);
    const [first, second] = sortTokenPublicKeys(key, key);

    expect(first.toBase58()).toBe(USDC);
    expect(second.toBase58()).toBe(USDC);
  });

  it("should return tuple regardless of input order", () => {
    const usdcKey = new PublicKey(USDC);
    const wsolKey = new PublicKey(WSOL);

    const [first1, second1] = sortTokenPublicKeys(usdcKey, wsolKey);
    const [first2, second2] = sortTokenPublicKeys(wsolKey, usdcKey);

    expect(first1.toBase58()).toBe(first2.toBase58());
    expect(second1.toBase58()).toBe(second2.toBase58());
  });
});

describe("sortSolanaAddresses", () => {
  it("should sort token addresses in canonical order", () => {
    const result = sortSolanaAddresses(USDC, WSOL);

    expect(result).toHaveProperty("tokenXAddress");
    expect(result).toHaveProperty("tokenYAddress");

    const usdcKey = new PublicKey(USDC);
    const wsolKey = new PublicKey(WSOL);
    const comparison = usdcKey.toBuffer().compare(wsolKey.toBuffer());

    if (comparison <= 0) {
      expect(result.tokenXAddress).toBe(USDC);
      expect(result.tokenYAddress).toBe(WSOL);
    } else {
      expect(result.tokenXAddress).toBe(WSOL);
      expect(result.tokenYAddress).toBe(USDC);
    }
  });

  it("should return same order when addresses are equal", () => {
    const result = sortSolanaAddresses(USDC, USDC);

    expect(result.tokenXAddress).toBe(USDC);
    expect(result.tokenYAddress).toBe(USDC);
  });

  it("should return consistent order regardless of input order", () => {
    const result1 = sortSolanaAddresses(USDC, WSOL);
    const result2 = sortSolanaAddresses(WSOL, USDC);

    expect(result1.tokenXAddress).toBe(result2.tokenXAddress);
    expect(result1.tokenYAddress).toBe(result2.tokenYAddress);
  });

  it("should throw error for invalid addresses", () => {
    expect(() => sortSolanaAddresses("invalid", WSOL)).toThrow(
      "Invalid public key input",
    );
    expect(() => sortSolanaAddresses(USDC, "invalid")).toThrow(
      "Invalid public key input",
    );
  });

  it("should delegate to sortTokenPublicKeys", () => {
    const result = sortSolanaAddresses(USDC, WSOL);

    const usdcKey = new PublicKey(USDC);
    const wsolKey = new PublicKey(WSOL);
    const [first, second] = sortTokenPublicKeys(usdcKey, wsolKey);

    expect(result.tokenXAddress).toBe(first.toBase58());
    expect(result.tokenYAddress).toBe(second.toBase58());
  });
});
