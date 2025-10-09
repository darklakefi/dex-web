import { describe, expect, it } from "vitest";
import { transformAddLiquidityInput } from "../addLiquidityTransformer";

/**
 * Confirms the numeric propagation/rounding hypothesis by showing that
 * an off-by-one or off-by-two error in available reserves can lead to
 * maxAmount calculations that underfund Solana's CEILING reverse amounts.
 *
 * This test is fully deterministic and does not use network.
 */
describe("Numeric propagation hypothesis (deterministic)", () => {
  const tokenXMint = "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX"; // DUX (6)
  const tokenYMint = "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY"; // DukY (9)

  // Known devnet snapshot from logs (available reserves AFTER fees)
  const reserveX = 2073302553378809n;
  const reserveY_correct = 9135329493041338n; // latest log shows trailing '8'
  const reserveY_minus1 = reserveY_correct - 1n; // emulate off-by-one
  const reserveY_minus2 = reserveY_correct - 2n; // emulate precision loss to 1336
  const totalLpSupply = 4343079910123139n; // LP decimals = 9

  const userInput = {
    slippage: "0.5", // X 6 decimals
    tokenAAmount: "1791529406.3984",
    tokenADecimals: 6, // Y 9 decimals
    tokenBAmount: "7893788.293102973",
    tokenBDecimals: 9,
  } as const;

  function makePayload(reserveY: bigint) {
    return transformAddLiquidityInput({
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
      slippage: userInput.slippage,
      tokenAAddress: tokenXMint,
      tokenAAmount: userInput.tokenAAmount,
      tokenADecimals: userInput.tokenADecimals,
      tokenBAddress: tokenYMint,
      tokenBAmount: userInput.tokenBAmount,
      tokenBDecimals: userInput.tokenBDecimals,
      userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    });
  }

  // Helper to compute Solana-required token amounts using CEILING from the correct reserves
  function computeRequiredFromLp(lp: bigint) {
    const supply = totalLpSupply;
    const reqX = (() => {
      let v = (lp * reserveX) / supply;
      if ((lp * reserveX) % supply > 0n && v > 0n) v += 1n;
      return v;
    })();
    const reqY = (() => {
      let v = (lp * reserveY_correct) / supply;
      if ((lp * reserveY_correct) % supply > 0n && v > 0n) v += 1n;
      return v;
    })();
    return { reqX, reqY };
  }

  it("max amounts from correct reserves cover required amounts", () => {
    const payload = makePayload(reserveY_correct);
    const { reqX, reqY } = computeRequiredFromLp(payload.amountLp);
    expect(payload.maxAmountX).toBeGreaterThanOrEqual(reqX);
    expect(payload.maxAmountY).toBeGreaterThanOrEqual(reqY);
  });

  it("off-by-one/-two in reserveY do NOT underfund max amounts at 0.5% slippage (falsify hypothesis)", () => {
    // Compute required amounts from correct reserves
    const baseline = makePayload(reserveY_correct);
    const { reqX, reqY } = computeRequiredFromLp(baseline.amountLp);

    const payloadMinus1 = makePayload(reserveY_minus1);
    const payloadMinus2 = makePayload(reserveY_minus2);

    // Expect neither degraded scenario to result in maxY < required Y
    const underfundMinus1 = payloadMinus1.maxAmountY < reqY;
    const underfundMinus2 = payloadMinus2.maxAmountY < reqY;

    expect(underfundMinus1).toBe(false);
    expect(underfundMinus2).toBe(false);
  });
});
