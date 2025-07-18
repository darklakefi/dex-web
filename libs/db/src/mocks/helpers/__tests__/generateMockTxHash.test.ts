import { describe, expect, it } from "vitest";
import { generateMockTxHash } from "../generateMockTxHash";

describe("generateMockTxHash", () => {
  it("should generate mock tx hash", () => {
    const txHash = generateMockTxHash();
    expect(txHash).toBeTypeOf("string");
    expect(txHash).toHaveLength(64);
    expect(txHash).toMatch(/^[0-9a-fA-F]{64}$/);
  });
});
