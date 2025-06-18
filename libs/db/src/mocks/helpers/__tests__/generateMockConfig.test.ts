import { describe, expect, it } from "vitest";
import { generateMockConfig } from "../generateMockConfig";

describe("generateMockConfig", () => {
  it("should generate mock config", () => {
    const config = generateMockConfig();
    expect(config).toHaveLength(4);
    expect(config[0]?.key).toBeTypeOf("string");
    expect(config[0]?.value).toBeTypeOf("string");
  });
});
