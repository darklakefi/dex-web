import { describe, expect, it } from "vitest";
import { generateMockSolanaAddress } from "../generateMockSolanaAddress";

describe("generateMockSolanaAddress", () => {
  it("should generate mock solana address", () => {
    const solanaAddress = generateMockSolanaAddress();
    expect(solanaAddress).toBeTypeOf("string");
    expect(solanaAddress).toHaveLength(44);
    expect(solanaAddress).toMatch(/^[1-9A-HJ-NP-Za-km-z]{44}$/);
  });
});
