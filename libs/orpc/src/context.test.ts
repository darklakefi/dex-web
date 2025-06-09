import { describe, expect, it } from "vitest";
import { createContext } from "./context";

describe("createContext", () => {
  it("should create a context", async () => {
    const context = await createContext({
      req: new Request("http://localhost"),
    });
    expect(context).toBeDefined();
  });
});
