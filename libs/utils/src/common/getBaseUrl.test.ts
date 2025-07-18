import { describe, expect, it } from "vitest";
import { getBaseUrl } from "./getBaseUrl";

describe("getBaseUrl", () => {
  it("should return the base url", () => {
    expect(getBaseUrl()).toBe("http://localhost:3000/rpc");
  });
});
