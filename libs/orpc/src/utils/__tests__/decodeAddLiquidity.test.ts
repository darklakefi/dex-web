import { describe, expect, it } from "vitest";
import {
  encodeAddLiquidityArgs,
  tryDecodeAddLiquidity,
} from "../decodeAddLiquidity";

describe("add_liquidity IDL encode/decode", () => {
  it("round-trips typical arguments (no optional fields)", () => {
    const args = {
      amount_lp: 3752831616709110n,
      label: null,
      max_amount_x: 1800487053430392n,
      max_amount_y: 7933257234568487n,
      ref_code: null,
    } as const;
    const data = encodeAddLiquidityArgs(args);
    const decoded = tryDecodeAddLiquidity(Buffer.from(data));
    expect(decoded).not.toBeNull();
    expect(decoded!.amount_lp).toBe(args.amount_lp);
    expect(decoded!.max_amount_x).toBe(args.max_amount_x);
    expect(decoded!.max_amount_y).toBe(args.max_amount_y);
    expect(decoded!.ref_code).toBeNull();
    expect(decoded!.label).toBeNull();
  });
});
