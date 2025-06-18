import { describe, expect, it } from "vitest";
import { generateMockTokens } from "../generateMockTokens";

describe("generateMockTokens", () => {
  it("should generate mock tokens", () => {
    const tokens = generateMockTokens(10);
    expect(tokens).toHaveLength(10);
    expect(tokens[0]?.name).toBeTypeOf("string");
    expect(tokens[0]?.symbol).toBeTypeOf("string");
    expect(tokens[0]?.token_address).toBeTypeOf("string");
  });
});
