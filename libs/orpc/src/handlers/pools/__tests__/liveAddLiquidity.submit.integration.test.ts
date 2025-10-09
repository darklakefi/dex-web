/*
  Live submit: Build via the same gateway builder, sign with local keypair (~/.config/solana/id.json),
  and submit to devnet. Chooses minimal amounts based on on-chain reserves so LP minted >= 3 and
  both token transfer amounts >= 1 raw unit, staying well within balances.

  Requires env:
  - HELIUS_API_KEY (for RPC)
  - GATEWAY_HOST (gateway service)
  Optional:
  - SIM_KEYPAIR_PATH (path to keypair JSON, defaults to ~/.config/solana/id.json)
*/

import fs from "node:fs";
import os from "node:os";
import { transformAddLiquidityInput } from "@dex-web/utils";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { getHelius } from "../../../getHelius";
import { tryDecodeAddLiquidity } from "../../../utils/decodeAddLiquidity";
import {
  deserializeVersionedTransaction,
  getPoolOnChain,
  getTokenProgramId,
} from "../../../utils/solana";
import { addLiquidityHandler } from "../../dex-gateway/addLiquidity.handler";
import { submitAddLiquidityHandler } from "../../liquidity/submitAddLiquidity.handler";

const hasEnv = !!process.env.HELIUS_API_KEY;

function ceilDiv(a: bigint, b: bigint): bigint {
  return (a + b - 1n) / b;
}

async function detectTokenProgram(mint: PublicKey) {
  const helius = getHelius();
  try {
    await getMint(helius.connection, mint, "confirmed", TOKEN_PROGRAM_ID);
    return TOKEN_PROGRAM_ID;
  } catch {
    try {
      await getMint(
        helius.connection,
        mint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID,
      );
      return TOKEN_2022_PROGRAM_ID;
    } catch {
      return TOKEN_PROGRAM_ID;
    }
  }
}

describe.skipIf(!hasEnv)("LIVE addLiquidity submit (devnet)", () => {
  it("builds via gateway, signs locally, submits and confirms", async () => {
    // Load local signer
    const keypairPath =
      process.env.SIM_KEYPAIR_PATH || `${os.homedir()}/.config/solana/id.json`;
    const raw = fs.readFileSync(keypairPath, "utf8");
    const secret = Uint8Array.from(JSON.parse(raw) as number[]);
    const signer = Keypair.fromSecretKey(secret);
    const userAddress = signer.publicKey.toBase58();

    const helius = getHelius();

    // Token mints
    const tokenXMint = new PublicKey(
      "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    );
    const tokenYMint = new PublicKey(
      "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
    );

    // Fetch pool
    const pool = await getPoolOnChain(
      tokenXMint.toBase58(),
      tokenYMint.toBase58(),
    );
    if (!pool) throw new Error("Pool not found");

    // Token decimals and programs
    const tokenXProgram = await detectTokenProgram(tokenXMint);
    const tokenYProgram = await detectTokenProgram(tokenYMint);
    const tokenXDecimals = (
      await getMint(helius.connection, tokenXMint, "confirmed", tokenXProgram)
    ).decimals;
    const tokenYDecimals = (
      await getMint(helius.connection, tokenYMint, "confirmed", tokenYProgram)
    ).decimals;

    // Available reserves and total LP
    const reserveXProgram = await getTokenProgramId(
      helius.connection,
      (pool as any).reserve_x as PublicKey,
    );
    const reserveYProgram = await getTokenProgramId(
      helius.connection,
      (pool as any).reserve_y as PublicKey,
    );
    const reserveXAcc = await getAccount(
      helius.connection,
      (pool as any).reserve_x,
      "confirmed",
      reserveXProgram,
    );
    const reserveYAcc = await getAccount(
      helius.connection,
      (pool as any).reserve_y,
      "confirmed",
      reserveYProgram,
    );
    const totalReserveX = BigInt(reserveXAcc.amount);
    const totalReserveY = BigInt(reserveYAcc.amount);
    const protocolFeeX = BigInt((pool as any).protocol_fee_x.toString());
    const protocolFeeY = BigInt((pool as any).protocol_fee_y.toString());
    const userLockedX = BigInt((pool as any).user_locked_x.toString());
    const userLockedY = BigInt((pool as any).user_locked_y.toString());
    const totalLpSupply = BigInt((pool as any).token_lp_supply.toString());
    const reserveX = totalReserveX - protocolFeeX - userLockedX;
    const reserveY = totalReserveY - protocolFeeY - userLockedY;

    // Minimal minted LP to ensure both token amounts >= 1 raw unit
    const mintedMin = (() => {
      const needX = ceilDiv(totalLpSupply, reserveX); // ceil(totalLP / reserveX)
      const needY = ceilDiv(totalLpSupply, reserveY); // ceil(totalLP / reserveY)
      return needX > needY ? needX : needY;
    })();

    // Compute minimal raw token amounts for mintedMin LP
    const amountXRaw = ceilDiv(mintedMin * reserveX, totalLpSupply);
    const amountYRaw = ceilDiv(mintedMin * reserveY, totalLpSupply);

    // Ensure balances are sufficient
    const ataX = getAssociatedTokenAddressSync(
      tokenXMint,
      signer.publicKey,
      false,
      tokenXProgram,
    );
    const ataY = getAssociatedTokenAddressSync(
      tokenYMint,
      signer.publicKey,
      false,
      tokenYProgram,
    );
    const [ataXInfo, ataYInfo] =
      await helius.connection.getMultipleAccountsInfo([ataX, ataY]);
    if (!ataXInfo || !ataYInfo) {
      throw new Error(
        "Missing user ATAs; please ensure token accounts exist with funds",
      );
    }
    const balX = BigInt(
      (await getAccount(helius.connection, ataX, "confirmed", tokenXProgram))
        .amount,
    );
    const balY = BigInt(
      (await getAccount(helius.connection, ataY, "confirmed", tokenYProgram))
        .amount,
    );
    if (balX < amountXRaw || balY < amountYRaw) {
      throw new Error(
        `Insufficient token balances for minimal LP: requires X=${amountXRaw} Y=${amountYRaw}, have X=${balX} Y=${balY}`,
      );
    }

    // FE-transformer with tiny amounts (decimal strings)
    const amountXDecimal = (
      Number(amountXRaw) /
      10 ** tokenXDecimals
    ).toString();
    const amountYDecimal = (
      Number(amountYRaw) /
      10 ** tokenYDecimals
    ).toString();

    const payload = transformAddLiquidityInput({
      poolReserves: {
        lockedX: userLockedX,
        lockedY: userLockedY,
        protocolFeeX,
        protocolFeeY,
        reserveX,
        reserveY,
        totalLpSupply,
        userLockedX,
        userLockedY,
      },
      slippage: "0.5",
      tokenAAddress: tokenXMint.toBase58(),
      tokenAAmount: amountXDecimal,
      tokenADecimals: tokenXDecimals,
      tokenBAddress: tokenYMint.toBase58(),
      tokenBAmount: amountYDecimal,
      tokenBDecimals: tokenYDecimals,
      userAddress,
    });

    // Build unsigned tx via gateway (ORPC applies rotation hack and validates)
    const response = await addLiquidityHandler({
      $typeName: "darklake.v1.AddLiquidityRequest",
      amountLp: payload.amountLp,
      label: "",
      maxAmountX: payload.maxAmountX,
      maxAmountY: payload.maxAmountY,
      refCode: "",
      tokenMintX: payload.tokenMintX,
      tokenMintY: payload.tokenMintY,
      userAddress,
    } as any);

    expect(response && (response as any).unsignedTransaction).toBeTruthy();

    const tx = deserializeVersionedTransaction(
      (response as any).unsignedTransaction!,
    );
    const ix0 = (tx.message as any).compiledInstructions?.[0];
    if (!ix0?.data)
      throw new Error("Unsigned transaction missing instruction data");
    const decoded = tryDecodeAddLiquidity(Buffer.from(ix0.data, "base64"));
    if (!decoded) throw new Error("Failed to decode add_liquidity args");
    // Verify decoded args match intended
    expect(decoded.amount_lp.toString()).toBe(payload.amountLp.toString());
    expect(decoded.max_amount_x.toString()).toBe(payload.maxAmountX.toString());
    expect(decoded.max_amount_y.toString()).toBe(payload.maxAmountY.toString());

    // Sign and submit
    tx.sign([signer]);
    const signedBase64 = Buffer.from(tx.serialize()).toString("base64");
    // Try direct submission via our RPC connection to avoid handler env issues
    let sig = "";
    try {
      sig = await helius.connection.sendRawTransaction(tx.serialize(), {
        maxRetries: 3,
        preflightCommitment: "confirmed",
        skipPreflight: false,
      });
      // eslint-disable-next-line no-console
      console.log("Submitted signature:", sig);
      await helius.connection.confirmTransaction(sig, "confirmed");
    } catch (directError) {
      // Fallback to handler-based submission
      console.warn(
        "Direct submission failed, trying handler:",
        directError instanceof Error
          ? directError.message
          : String(directError),
      );
      const submission = await submitAddLiquidityHandler({
        signedTransaction: signedBase64,
        tokenXMint: payload.tokenMintX,
        tokenYMint: payload.tokenMintY,
        userAddress,
      });
      // eslint-disable-next-line no-console
      console.log("AddLiquidity submit result (handler):", submission);
      expect(submission.success).toBe(true);
      expect(submission.signature).toBeTruthy();
      sig = submission.signature!;
    }
    expect(sig).toBeTruthy();
  }, 180_000);
});
