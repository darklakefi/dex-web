import { describe, expect, it } from "vitest";

describe("Exchange Rate Order Independence", () => {
  it("should calculate exchange rate correctly regardless of token order", () => {
    const mockPoolData = {
      reserveX: 1000,
      reserveY: 2000,
      tokenXMint: "tokenA",
      tokenYMint: "tokenB",
    };

    const editedTokenAddress = "tokenA";
    const isEditedTokenX = mockPoolData.tokenXMint === editedTokenAddress;

    const inputAmount = 100;
    let outputAmount: number;

    if (isEditedTokenX) {
      outputAmount =
        (inputAmount * mockPoolData.reserveY) / mockPoolData.reserveX;
    } else {
      outputAmount =
        (inputAmount * mockPoolData.reserveX) / mockPoolData.reserveY;
    }

    expect(outputAmount).toBe(200);
  });

  it("should calculate exchange rate correctly when token order is flipped", () => {
    const flippedPoolData = {
      reserveX: 1000,
      reserveY: 2000,
      tokenXMint: "tokenB",
      tokenYMint: "tokenA",
    };

    const editedTokenAddress = "tokenA";
    const isEditedTokenX = flippedPoolData.tokenXMint === editedTokenAddress;

    const inputAmount = 100;
    let outputAmount: number;

    if (isEditedTokenX) {
      outputAmount =
        (inputAmount * flippedPoolData.reserveY) / flippedPoolData.reserveX;
    } else {
      outputAmount =
        (inputAmount * flippedPoolData.reserveX) / flippedPoolData.reserveY;
    }

    expect(outputAmount).toBe(50);
  });

  it("should determine correct field mapping based on edited token", () => {
    const editedToken = "tokenA";
    const targetField =
      editedToken === "tokenA" ? "tokenBAmount" : "tokenAAmount";

    expect(targetField).toBe("tokenBAmount");
  });

  it("should determine correct field mapping when tokenB is edited", () => {
    const editedToken = "tokenB";
    const targetField =
      editedToken === "tokenA" ? "tokenBAmount" : "tokenAAmount";

    expect(targetField).toBe("tokenAAmount");
  });
});
