/*
  Integration simulation: builds an add_liquidity instruction via Anchor IDL,
  assembles all required accounts, and attempts to simulate it against devnet.

  It first fetches on-chain pool state and computes amountLp and maxAmount{X,Y}
  via the same FE transformer to ensure the math is consistent. Then it encodes
  the IDL args and constructs the full instruction account list required by the
  program. If any critical user accounts (e.g., ATAs) are missing, the test is
  skipped with a diagnostic message.
*/

import fs from "node:fs";
import os from "node:os";
import { getLpTokenMint } from "@dex-web/core";
import { transformAddLiquidityInput } from "@dex-web/utils";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  type Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { getHelius } from "../../../getHelius";
import { encodeAddLiquidityArgs } from "../../../utils/decodeAddLiquidity";
import {
  EXCHANGE_PROGRAM_ID,
  getPoolOnChain,
  getPoolPubkey,
  getTokenProgramId,
} from "../../../utils/solana";

const ORDER_OWNER_DEFAULT = "4doTkL1geeiw3EHeoKgXx9EQ84DAV2fsx3GSdGiHJX8u"; // provided by user
const ORDER_OWNER_ENV = process.env.SIM_ORDER_OWNER || ORDER_OWNER_DEFAULT;
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

async function detectTokenProgram(connection: Connection, mint: PublicKey) {
  try {
    await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);
    return TOKEN_PROGRAM_ID;
  } catch {
    try {
      await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
      return TOKEN_2022_PROGRAM_ID;
    } catch {
      return TOKEN_PROGRAM_ID;
    }
  }
}

function toBigInt(value: unknown): bigint {
  if (!value) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  if (typeof value === "object" && value && "toString" in value)
    return BigInt((value as any).toString());
  return 0n;
}

describe.skipIf(!process.env.HELIUS_API_KEY)(
  "Simulate add_liquidity instruction (on-chain)",
  () => {
    it("builds the instruction and simulates against devnet (skips if ATAs missing)", async () => {
      const helius = getHelius();
      const connection = helius.connection;

      // Attempt to load local Solana keypair (~/.config/solana/id.json) unless SIM_KEYPAIR_PATH provided
      const keypairPath =
        process.env.SIM_KEYPAIR_PATH ||
        `${os.homedir()}/.config/solana/id.json`;
      let signer: Keypair | null = null;
      try {
        const raw = fs.readFileSync(keypairPath, "utf8");
        const arr = JSON.parse(raw) as number[];
        const secret = Uint8Array.from(arr);
        signer = Keypair.fromSecretKey(secret);
        // eslint-disable-next-line no-console
        console.log("Loaded local signer:", signer.publicKey.toBase58());
      } catch (e) {
        console.warn(
          "Could not load local keypair; will skip if signer required",
          e instanceof Error ? e.message : String(e),
        );
      }

      const orderOwnerPk = signer
        ? signer.publicKey
        : new PublicKey(ORDER_OWNER_ENV);
      const tokenXMint = new PublicKey(
        "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
      );
      const tokenYMint = new PublicKey(
        "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
      );

      // --- Fetch on-chain pool state ---
      const pool = await getPoolOnChain(
        tokenXMint.toBase58(),
        tokenYMint.toBase58(),
      );
      if (!pool) throw new Error("Pool not found on-chain");

      const tokenXDecimals = (
        await getMint(
          connection,
          tokenXMint,
          "confirmed",
          await detectTokenProgram(connection, tokenXMint),
        )
      ).decimals;
      const tokenYDecimals = (
        await getMint(
          connection,
          tokenYMint,
          "confirmed",
          await detectTokenProgram(connection, tokenYMint),
        )
      ).decimals;

      const reserveXAcc = await getAccount(
        connection,
        (pool as any).reserve_x,
        "confirmed",
        await getTokenProgramId(connection, (pool as any).reserve_x),
      );
      const reserveYAcc = await getAccount(
        connection,
        (pool as any).reserve_y,
        "confirmed",
        await getTokenProgramId(connection, (pool as any).reserve_y),
      );

      const totalReserveX = BigInt(reserveXAcc.amount);
      const totalReserveY = BigInt(reserveYAcc.amount);
      const protocolFeeX = toBigInt((pool as any).protocol_fee_x);
      const protocolFeeY = toBigInt((pool as any).protocol_fee_y);
      const userLockedX = toBigInt((pool as any).user_locked_x);
      const userLockedY = toBigInt((pool as any).user_locked_y);
      const totalLpSupply = toBigInt((pool as any).token_lp_supply);
      const availableX = totalReserveX - protocolFeeX - userLockedX;
      const availableY = totalReserveY - protocolFeeY - userLockedY;

      // --- FE-transform to compute amountLp and maxAmount{X,Y} ---
      const payload = transformAddLiquidityInput({
        poolReserves: {
          lockedX: userLockedX,
          lockedY: userLockedY,
          protocolFeeX,
          protocolFeeY,
          reserveX: availableX,
          reserveY: availableY,
          totalLpSupply,
          userLockedX,
          userLockedY,
        },
        slippage: "0.5",
        tokenAAddress: tokenXMint.toBase58(),
        tokenAAmount: "1791529406.3984",
        tokenADecimals: tokenXDecimals,
        tokenBAddress: tokenYMint.toBase58(),
        tokenBAmount: "7893788.293102973",
        tokenBDecimals: tokenYDecimals,
        userAddress: orderOwnerPk.toBase58(),
      });

      // --- Derive all required accounts from IDL ---
      const ammConfigSeed = Buffer.from("amm_config");
      const [ammConfigPda] = PublicKey.findProgramAddressSync(
        [ammConfigSeed, Buffer.from([0, 0, 0, 0])],
        EXCHANGE_PROGRAM_ID,
      );
      const poolPubkey = await getPoolPubkey(
        tokenXMint.toBase58(),
        tokenYMint.toBase58(),
      );
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        EXCHANGE_PROGRAM_ID,
      );

      const tokenXProgram = await detectTokenProgram(connection, tokenXMint);
      const tokenYProgram = await detectTokenProgram(connection, tokenYMint);
      const userTokenX = getAssociatedTokenAddressSync(
        tokenXMint,
        orderOwnerPk,
        false,
        tokenXProgram,
      );
      const userTokenY = getAssociatedTokenAddressSync(
        tokenYMint,
        orderOwnerPk,
        false,
        tokenYProgram,
      );
      const callerPk = orderOwnerPk;
      // LP mint and ATA
      const lpMint = await getLpTokenMint(
        tokenXMint.toBase58(),
        tokenYMint.toBase58(),
      );
      let lpProgramId = TOKEN_PROGRAM_ID;
      try {
        await getMint(connection, lpMint, "confirmed", TOKEN_2022_PROGRAM_ID);
        lpProgramId = TOKEN_2022_PROGRAM_ID;
      } catch {
        lpProgramId = TOKEN_PROGRAM_ID;
      }
      const userLpAta = getAssociatedTokenAddressSync(
        lpMint,
        orderOwnerPk,
        false,
        lpProgramId,
      );

      // Ensure required user ATAs exist; otherwise skip (cannot simulate without them)
      const ataInfos = await connection.getMultipleAccountsInfo([
        userTokenX,
        userTokenY,
        userLpAta,
        (pool as any).reserve_x,
        (pool as any).reserve_y,
      ]);
      const [userXInfo, userYInfo, userLpInfo, poolXInfo, poolYInfo] =
        ataInfos as any;
      if (!userXInfo || !userYInfo || !poolXInfo || !poolYInfo) {
        console.warn(
          "Skipping simulation: missing critical ATAs or pool accounts",
          {
            poolXExists: !!poolXInfo,
            poolYExists: !!poolYInfo,
            userLpExists: !!userLpInfo,
            userXExists: !!userXInfo,
            userYExists: !!userYInfo,
          },
        );
        expect(true).toBe(true);
        return;
      }

      // Match Rust accounts order for AddLiquidity<'info>
      const accountMetas = [
        { isSigner: false, isWritable: false, pubkey: tokenXMint }, // token_mint_x
        { isSigner: false, isWritable: false, pubkey: tokenYMint }, // token_mint_y
        { isSigner: false, isWritable: false, pubkey: tokenXProgram }, // token_mint_x_program
        { isSigner: false, isWritable: false, pubkey: tokenYProgram }, // token_mint_y_program
        { isSigner: false, isWritable: true, pubkey: lpMint }, // token_mint_lp (mut)
        { isSigner: false, isWritable: false, pubkey: lpProgramId }, // token_mint_lp_program
        { isSigner: false, isWritable: true, pubkey: poolPubkey }, // pool (mut)
        { isSigner: false, isWritable: false, pubkey: ammConfigPda }, // amm_config
        { isSigner: false, isWritable: false, pubkey: authorityPda }, // authority
        { isSigner: false, isWritable: true, pubkey: userTokenX }, // user_token_account_x (mut)
        { isSigner: false, isWritable: true, pubkey: userTokenY }, // user_token_account_y (mut)
        { isSigner: false, isWritable: true, pubkey: userLpAta }, // user_token_account_lp (init_if_needed)
        {
          isSigner: false,
          isWritable: true,
          pubkey: (pool as any).reserve_x as PublicKey,
        }, // pool_token_reserve_x (mut)
        {
          isSigner: false,
          isWritable: true,
          pubkey: (pool as any).reserve_y as PublicKey,
        }, // pool_token_reserve_y (mut)
        { isSigner: true, isWritable: true, pubkey: orderOwnerPk }, // user (signer)
        {
          isSigner: false,
          isWritable: false,
          pubkey: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        }, // associated_token_program
        { isSigner: false, isWritable: false, pubkey: SystemProgram.programId }, // system_program
      ];

      const data = encodeAddLiquidityArgs({
        amount_lp: payload.amountLp,
        label: null,
        max_amount_x: payload.maxAmountX,
        max_amount_y: payload.maxAmountY,
        ref_code: null,
      });

      const ix = { data, keys: accountMetas, programId: EXCHANGE_PROGRAM_ID };
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        instructions: [ix as any],
        payerKey: orderOwnerPk,
        recentBlockhash: blockhash,
      }).compileToV0Message();
      const tx = new VersionedTransaction(message);
      if (signer) {
        tx.sign([signer]);
      } else {
        console.warn(
          "No signer available; simulation may fail with AccountNotSigner",
        );
      }

      const sim = await connection.simulateTransaction(tx, { sigVerify: true });

      // If simulation returns logs, ensure we did not fail slippage check.
      const logs = sim.value.logs || [];
      const combined = logs.join("\n");
      // eslint-disable-next-line no-console
      console.log("Simulation logs:\n", combined);
      expect(combined.includes("SlippageExceeded")).toBe(false);
    }, 90_000);
  },
);
