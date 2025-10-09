import { describe, expect, it } from "vitest";
import { transformAddLiquidityInput } from "../addLiquidityTransformer";

/**
 * Parity test based on CURRENT_ISSUE known values to ensure
 * transformer computes Solana-compatible max amounts and LP tokens
 * with precise BigInt math and CEILING rounding for reverse calc.
 */
describe("transformAddLiquidityInput - Devnet Parity", () => {
  it("matches expected LP and max amounts for known pool", () => {
    // Known devnet pool values (AVAILABLE reserves after fees), from CURRENT_ISSUE.md
    const reserveX = 2073302553378809n; // DUX (6 decimals)
    const reserveY = 9135329493041338n; // DukY (9 decimals) - latest log shows trailing '8'
    const totalLpSupply = 4343079910123139n; // LP decimals = 9

    const input = {
      poolReserves: {
        lockedX: 0n,
        lockedY: 0n,
        protocolFeeX: 0n,
        protocolFeeY: 0n,
        reserveX,
        reserveY,
        totalLpSupply,
        userLockedX: 0n,
        userLockedY: 0n,
      },
      // Slippage 0.5%
      slippage: "0.5",
      // Token addresses from CURRENT_ISSUE (order doesn't matter; function sorts)
      tokenAAddress: "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX", // DUX (6)
      tokenAAmount: "1791529406.3984",
      tokenADecimals: 6,
      tokenBAddress: "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY", // DukY (9)
      tokenBAmount: "7893788.293102973",
      tokenBDecimals: 9,
      userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    } as const;

    const result = transformAddLiquidityInput(input);

    // From CURRENT_ISSUE calculations
    // lpTokens = 3,752,831,616,709,110 (ROUND_DOWN)
    expect(result.amountLp).toBe(3752831616709110n);

    // Solana CEILING reverse amounts (before slippage)
    // X: 1,791,529,406,398,400; Y: 7,893,788,293,102,972
    // With 0.5% slippage (rounded up to integer raw):
    expect(result.maxAmountX).toBe(1800487053430392n);
    expect(result.maxAmountY).toBe(7933257234568487n);
  });
});
