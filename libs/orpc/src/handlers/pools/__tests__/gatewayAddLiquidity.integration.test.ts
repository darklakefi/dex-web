/*
  Integration: use the SAME builder as the add-liquidity dialog.
  This calls the ORPC dex-gateway addLiquidity procedure (which normalizes
  X<Y and calls the gRPC Solana gateway), retrieves the unsigned transaction,
  deserializes it and simulates it (sigVerify: false) against devnet.

  Skips if GATEWAY_HOST is not configured.
*/

import { transformAddLiquidityInput } from "@dex-web/utils";
import { describe, expect, it } from "vitest";
import { getHelius } from "../../../getHelius";
import { tryDecodeAddLiquidity } from "../../../utils/decodeAddLiquidity";
import { deserializeVersionedTransaction } from "../../../utils/solana";
import { addLiquidityHandler } from "../../dex-gateway/addLiquidity.handler";

const hasGateway = !!process.env.GATEWAY_HOST;

describe.skipIf(!hasGateway)("Gateway addLiquidity builder integration", () => {
  it("builds via gateway, returns unsigned tx, simulates without sigVerify", async () => {
    const helius = getHelius();

    // Use the same inputs as the FE dialog & parity tests
    const tokenXMint = "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX";
    const tokenYMint = "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY";
    const userAddress =
      process.env.SIM_ORDER_OWNER ||
      "4doTkL1geeiw3EHeoKgXx9EQ84DAV2fsx3GSdGiHJX8u";

    const payload = transformAddLiquidityInput({
      poolReserves: {
        lockedX: 0n,
        lockedY: 0n,
        protocolFeeX: 4479071022376n,
        protocolFeeY: 44809704524151n,
        reserveX: 2073302553378809n,
        reserveY: 9135329493041338n,
        totalLpSupply: 4343079910123139n,
        userLockedX: 0n,
        userLockedY: 0n,
      },
      slippage: "0.5",
      tokenAAddress: tokenXMint,
      tokenAAmount: "1791529406.3984",
      tokenADecimals: 6,
      tokenBAddress: tokenYMint,
      tokenBAmount: "7893788.293102973",
      tokenBDecimals: 9,
      userAddress,
    });

    // Call the same procedure FE uses (normalizes X/Y before calling gateway)
    const response = await addLiquidityHandler({
      $typeName: "darklake.v1.AddLiquidityRequest",
      amountLp: payload.amountLp,
      label: "",
      maxAmountX: payload.maxAmountX,
      maxAmountY: payload.maxAmountY,
      refCode: "",
      tokenMintX: payload.tokenMintX,
      tokenMintY: payload.tokenMintY,
      userAddress: payload.userAddress,
    } as any);

    expect(response.unsignedTransaction).toBeTruthy();
    const tx = deserializeVersionedTransaction(response.unsignedTransaction!);
    const ix0a = (tx.message as any).compiledInstructions?.[0];
    if (ix0a) {
      // For v0, need to expand address table; but for decoding args we can take the data directly
      const dataBase64 = ix0a.data as string;
      const decoded = tryDecodeAddLiquidity(Buffer.from(dataBase64, "base64"));
      // eslint-disable-next-line no-console
      console.log("Decoded builder args:", {
        amount_lp: decoded?.amount_lp.toString(),
        max_amount_x: decoded?.max_amount_x.toString(),
        max_amount_y: decoded?.max_amount_y.toString(),
      });
    }

    const sim = await helius.connection.simulateTransaction(tx, {
      sigVerify: false,
    });
    const logs = sim.value.logs?.join("\n") || "";
    // eslint-disable-next-line no-console
    console.log("Gateway simulation logs:\n", logs);
    // After hack, decoded args should match intended FE values; the simulation outcome may still fail for other reasons,
    // but we specifically assert args are correct now.
    const ix0b = (tx.message as any).compiledInstructions?.[0];
    expect(ix0b).toBeTruthy();
    const decoded2 = ix0b?.data
      ? tryDecodeAddLiquidity(Buffer.from(ix0b.data, "base64"))
      : null;
    expect(decoded2?.amount_lp.toString()).toBe("3752831616709110");
    expect(decoded2?.max_amount_x.toString()).toBe("1800487053430392");
    expect(decoded2?.max_amount_y.toString()).toBe("7933257234568487");
  }, 60_000);
});
