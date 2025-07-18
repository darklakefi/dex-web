import { describe, expect, it } from "vitest";
import { generateMockTokenMetadata } from "../generateMockTokenMetadata";

describe("generateMockTokenMetadata", () => {
  it("should generate mock token metadata", () => {
    const tokenMetadata = generateMockTokenMetadata(10);
    expect(tokenMetadata).toHaveLength(10);
    expect(tokenMetadata[0]?.decimals).toBeTypeOf("number");
    expect(tokenMetadata[0]?.name).toBeTypeOf("string");
    expect(tokenMetadata[0]?.symbol).toBeTypeOf("string");
    expect(tokenMetadata[0]?.token_address).toBeTypeOf("string");
    expect(tokenMetadata[0]?.uri).toBeTypeOf("string");
  });
});
