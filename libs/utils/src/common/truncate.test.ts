import { describe, expect, it } from "vitest";
import { truncate } from "./truncate";

describe("truncate", () => {
  it("should not truncate string if shorter than specified length", () => {
    expect(truncate("Hello", 8)).toBe("Hello");
  });

  it("should use default sideLength of 4 when not specified", () => {
    expect(truncate("This is a very long string that needs truncation")).toBe(
      "This...tion",
    );
  });

  it("should keep both start and end parts when truncating", () => {
    expect(truncate("abcdefghijklmnopqrstuvwxyz", 5, 5)).toBe("abcde...vwxyz");
  });

  it("should handle empty strings", () => {
    expect(truncate("", 4)).toBe("");
  });
});
