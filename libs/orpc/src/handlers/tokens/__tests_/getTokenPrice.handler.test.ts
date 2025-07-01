import { describe, expect, it } from "vitest";
import { getTokenPriceHandler } from "../getTokenPrice.handler";

describe("getTokenPriceHandler", () => {
  it("should return the price of the token", async () => {
    const input = {
      amount: 1,
      mint: "So11111111111111111111111111111111111111112",
      quoteCurrency: "usd" as const,
    };

    const result = await getTokenPriceHandler(input);

    expect(result).toEqual({
      mint: "So11111111111111111111111111111111111111112",
      price: 150.25,
      quoteCurrency: "usd",
    });
  });
});
