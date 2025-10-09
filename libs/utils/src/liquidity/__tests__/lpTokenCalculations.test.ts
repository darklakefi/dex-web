/**
 * Test suite to verify our LP token calculations match Solana's Rust implementation.
 *
 * This replicates the exact logic from:
 * - add_liquidity.rs (lines 122-147)
 * - utils.rs lp_tokens_to_trading_tokens function
 */

import { describe, expect, it } from "vitest";

enum RoundDirection {
  Floor = "Floor",
  Ceiling = "Ceiling",
}

interface TradingTokenResult {
  tokenXAmount: bigint;
  tokenYAmount: bigint;
}

/**
 * Direct port of Rust's lp_tokens_to_trading_tokens function.
 *
 * From utils.rs:
 * ```rust
 * pub fn lp_tokens_to_trading_tokens(
 *     lp_token_amount: u128,
 *     lp_token_supply: u128,
 *     swap_token_x_amount: u128,
 *     swap_token_y_amount: u128,
 *     round_direction: RoundDirection,
 * ) -> Option<TradingTokenResult>
 * ```
 */
function lpTokensToTradingTokens(
  lpTokenAmount: bigint,
  lpTokenSupply: bigint,
  swapTokenXAmount: bigint,
  swapTokenYAmount: bigint,
  roundDirection: RoundDirection,
): TradingTokenResult | null {
  if (lpTokenSupply === 0n) {
    return null;
  }

  // token_x_amount = lp_token_amount * swap_token_x_amount / lp_token_supply
  let tokenXAmount = (lpTokenAmount * swapTokenXAmount) / lpTokenSupply;
  let tokenYAmount = (lpTokenAmount * swapTokenYAmount) / lpTokenSupply;

  if (roundDirection === RoundDirection.Ceiling) {
    // Check if there's a remainder for X
    const tokenXRemainder = (lpTokenAmount * swapTokenXAmount) % lpTokenSupply;
    if (tokenXRemainder > 0n && tokenXAmount > 0n) {
      tokenXAmount += 1n;
    }

    // Check if there's a remainder for Y
    const tokenYRemainder = (lpTokenAmount * swapTokenYAmount) % lpTokenSupply;
    if (tokenYRemainder > 0n && tokenYAmount > 0n) {
      tokenYAmount += 1n;
    }
  }

  return {
    tokenXAmount,
    tokenYAmount,
  };
}

describe("LP Token Calculations - Rust Parity", () => {
  describe("lpTokensToTradingTokens", () => {
    it("should calculate floor rounding correctly", () => {
      const lpTokenAmount = 1000000n;
      const lpTokenSupply = 3000000n;
      const reserveX = 2000000n;
      const reserveY = 4000000n;

      const result = lpTokensToTradingTokens(
        lpTokenAmount,
        lpTokenSupply,
        reserveX,
        reserveY,
        RoundDirection.Floor,
      );

      expect(result).not.toBeNull();
      expect(result!.tokenXAmount).toBe(666666n); // floor(2000000 * 1000000 / 3000000)
      expect(result!.tokenYAmount).toBe(1333333n); // floor(4000000 * 1000000 / 3000000)
    });

    it("should calculate ceiling rounding correctly", () => {
      const lpTokenAmount = 1000000n;
      const lpTokenSupply = 3000000n;
      const reserveX = 2000000n;
      const reserveY = 4000000n;

      const result = lpTokensToTradingTokens(
        lpTokenAmount,
        lpTokenSupply,
        reserveX,
        reserveY,
        RoundDirection.Ceiling,
      );

      expect(result).not.toBeNull();
      // With remainder, should add 1
      expect(result!.tokenXAmount).toBe(666667n); // ceiling
      expect(result!.tokenYAmount).toBe(1333334n); // ceiling
    });

    it("should match transaction logs values", () => {
      // From actual transaction logs:
      const lpTokenAmount = 3752831616709110n;
      const lpTokenSupply = 4343079910123139n;
      const reserveX = 2073302553378809n;
      const reserveY = 9135329493041336n;

      const result = lpTokensToTradingTokens(
        lpTokenAmount,
        lpTokenSupply,
        reserveX,
        reserveY,
        RoundDirection.Ceiling,
      );

      expect(result).not.toBeNull();

      console.log("Rust-style calculation result:", {
        expectedX: "1791529406398400",
        expectedY: "7893788293102970",
        tokenX: result!.tokenXAmount.toString(),
        tokenY: result!.tokenYAmount.toString(), // This is what Solana should calculate
      });

      // These should match what Solana calculates
      expect(result!.tokenXAmount).toBe(1791529406398400n);
      expect(result!.tokenYAmount).toBe(7893788293102970n);
    });

    it("should not add 1 when there is no remainder", () => {
      const lpTokenAmount = 1000000n;
      const lpTokenSupply = 2000000n;
      const reserveX = 4000000n;
      const reserveY = 8000000n;

      const result = lpTokensToTradingTokens(
        lpTokenAmount,
        lpTokenSupply,
        reserveX,
        reserveY,
        RoundDirection.Ceiling,
      );

      expect(result).not.toBeNull();
      // No remainder, so no +1
      expect(result!.tokenXAmount).toBe(2000000n);
      expect(result!.tokenYAmount).toBe(4000000n);
    });

    it("should handle edge case when tokenAmount is 0", () => {
      const lpTokenAmount = 1n;
      const lpTokenSupply = 1000000n;
      const reserveX = 100n;
      const reserveY = 200n;

      const result = lpTokensToTradingTokens(
        lpTokenAmount,
        lpTokenSupply,
        reserveX,
        reserveY,
        RoundDirection.Ceiling,
      );

      expect(result).not.toBeNull();
      // floor(100 * 1 / 1000000) = 0, but with remainder and amount > 0 check
      // Since tokenXAmount = 0, should NOT add 1 (Rust check: token_x_amount > 0)
      expect(result!.tokenXAmount).toBe(0n);
      expect(result!.tokenYAmount).toBe(0n);
    });
  });
});

export { lpTokensToTradingTokens, RoundDirection };
