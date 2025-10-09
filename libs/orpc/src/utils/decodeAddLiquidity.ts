import { BN, BorshCoder, type Idl } from "@coral-xyz/anchor";
import IDL from "../darklake-idl";

const coder = new BorshCoder(IDL as Idl);

export type AddLiquidityArgs = {
  amount_lp: bigint;
  max_amount_x: bigint;
  max_amount_y: bigint;
  ref_code: Uint8Array | null; // up to 20 bytes if present
  label: Uint8Array | null; // up to 21 bytes if present
};

export function encodeAddLiquidityArgs(args: AddLiquidityArgs): Buffer {
  return coder.instruction.encode("add_liquidity", {
    amount_lp: new BN(args.amount_lp.toString()),
    label: args.label ? { some: Array.from(args.label) } : null,
    max_amount_x: new BN(args.max_amount_x.toString()),
    max_amount_y: new BN(args.max_amount_y.toString()),
    ref_code: args.ref_code ? { some: Array.from(args.ref_code) } : null,
  } as any);
}

export function tryDecodeAddLiquidity(data: Buffer): AddLiquidityArgs | null {
  const decoded = coder.instruction.decode(data) as {
    name: string;
    data: any;
  } | null;
  if (!decoded || decoded.name !== "add_liquidity") return null;
  const d = decoded.data;
  return {
    amount_lp: BigInt(d.amount_lp),
    label: d.label?.some ? new Uint8Array(d.label.some as number[]) : null,
    max_amount_x: BigInt(d.max_amount_x),
    max_amount_y: BigInt(d.max_amount_y),
    ref_code: d.ref_code?.some
      ? new Uint8Array(d.ref_code.some as number[])
      : null,
  };
}
