import { describe, expect, it } from "vitest";
import { allTruthy, combineEnabled } from "../queryHelpers";

describe("queryHelpers", () => {
  describe("combineEnabled", () => {
    it("should return false when hasRequiredParams is false and userEnabled is undefined", () => {
      expect(combineEnabled(false, undefined)).toBe(false);
    });

    it("should return false when hasRequiredParams is false and userEnabled is true", () => {
      expect(combineEnabled(false, true)).toBe(false);
    });

    it("should return false when hasRequiredParams is false and userEnabled is false", () => {
      expect(combineEnabled(false, false)).toBe(false);
    });

    it("should return true when hasRequiredParams is true and userEnabled is undefined", () => {
      expect(combineEnabled(true, undefined)).toBe(true);
    });

    it("should return true when hasRequiredParams is true and userEnabled is true", () => {
      expect(combineEnabled(true, true)).toBe(true);
    });

    it("should return false when hasRequiredParams is true and userEnabled is false", () => {
      expect(combineEnabled(true, false)).toBe(false);
    });

    it("should prioritize base validation over user enabled", () => {
      expect(combineEnabled(false, true)).toBe(false);
    });

    it("should allow user to disable even when params are valid", () => {
      expect(combineEnabled(true, false)).toBe(false);
    });
  });

  describe("allTruthy", () => {
    it("should return true when all values are truthy", () => {
      expect(allTruthy(["value", 123, true, {}])).toBe(true);
    });

    it("should return false when any value is falsy", () => {
      expect(allTruthy(["value", "", true])).toBe(false);
      expect(allTruthy(["value", 0, true])).toBe(false);
      expect(allTruthy(["value", null, true])).toBe(false);
      expect(allTruthy(["value", undefined, true])).toBe(false);
      expect(allTruthy(["value", false, true])).toBe(false);
    });

    it("should return true for empty array", () => {
      expect(allTruthy([])).toBe(true);
    });

    it("should handle single value", () => {
      expect(allTruthy(["value"])).toBe(true);
      expect(allTruthy([null])).toBe(false);
    });

    it("should work with mixed types", () => {
      expect(allTruthy([1, "string", true, {}, []])).toBe(true);
      expect(allTruthy([1, "string", 0, {}, []])).toBe(false);
    });
  });
});
