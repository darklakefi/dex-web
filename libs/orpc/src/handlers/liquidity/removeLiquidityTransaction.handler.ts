import { BN, type Idl, type Program, web3 } from "@coral-xyz/anchor";
import { createLiquidityProgram } from "@dex-web/core";
import { sortTokenPublicKeys } from "@dex-web/utils";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, type Transaction } from "@solana/web3.js";
import IDL from "../../darklake-idl";
import type {
  RemoveLiquidityTransactionInput,
  RemoveLiquidityTransactionOutput,
} from "../../schemas/liquidity/removeLiquidityTransaction.schema";

const POOL_RESERVE_SEED = "pool_reserve";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";
const LIQUIDITY_SEED = "lp";

async function removeLiquidity(
  user: PublicKey,
  program: Program<Idl>,
  tokenXMint: PublicKey,
  tokenXProgramId: PublicKey,
  tokenYMint: PublicKey,
  tokenYProgramId: PublicKey,
  minAmountX: string,
  minAmountY: string,
  lpTokensToBurn: string,
): Promise<Transaction> {
  const [mintA, mintB] = sortTokenPublicKeys(tokenXMint, tokenYMint);

  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(AMM_CONFIG_SEED), new BN(0).toArrayLike(Buffer, "le", 4)],
    program.programId,
  );

  const [poolPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_SEED),
      ammConfig.toBuffer(),
      mintA.toBuffer(),
      mintB.toBuffer(),
    ],
    program.programId,
  );

  const [lpMint] = PublicKey.findProgramAddressSync(
    [Buffer.from(LIQUIDITY_SEED), poolPubkey.toBuffer()],
    program.programId,
  );

  const userTokenAccountX = getAssociatedTokenAddressSync(
    tokenXMint,
    user,
    true,
    tokenXProgramId,
  );

  const userTokenAccountY = getAssociatedTokenAddressSync(
    tokenYMint,
    user,
    true,
    tokenYProgramId,
  );

  const userTokenAccountLp = getAssociatedTokenAddressSync(
    lpMint,
    user,
    true,
    TOKEN_PROGRAM_ID,
  );

  const [poolTokenAccountX] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_RESERVE_SEED),
      poolPubkey.toBuffer(),
      tokenXMint.toBuffer(),
    ],
    program.programId,
  );

  const [poolTokenAccountY] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_RESERVE_SEED),
      poolPubkey.toBuffer(),
      tokenYMint.toBuffer(),
    ],
    program.programId,
  );

  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    program.programId,
  );

  if (!program.methods.removeLiquidity) {
    throw new Error("removeLiquidity method not found on program");
  }

  const instruction = await program.methods
    .removeLiquidity(
      new BN(lpTokensToBurn),
      new BN(minAmountX),
      new BN(minAmountY),
      null,
    )
    .accounts({
      ammConfig: ammConfig,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      authority,
      pool: poolPubkey,
      poolTokenReserveX: poolTokenAccountX,
      poolTokenReserveY: poolTokenAccountY,
      systemProgram: web3.SystemProgram.programId,
      tokenMintLp: lpMint,
      tokenMintX: tokenXMint,
      tokenMintXProgram: tokenXProgramId,
      tokenMintY: tokenYMint,
      tokenMintYProgram: tokenYProgramId,
      tokenProgram: TOKEN_PROGRAM_ID,
      user,
      userTokenAccountLp: userTokenAccountLp,
      userTokenAccountX: userTokenAccountX,
      userTokenAccountY: userTokenAccountY,
    })
    .instruction();

  const programTx = new web3.Transaction();
  programTx.add(instruction);

  const conn = program.provider.connection;
  const ixes: web3.TransactionInstruction[] = [];

  const userTokenXInfo = await conn.getAccountInfo(userTokenAccountX);
  if (!userTokenXInfo) {
    ixes.push(
      createAssociatedTokenAccountInstruction(
        user,
        userTokenAccountX,
        user,
        tokenXMint,
        tokenXProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }
  const userTokenYInfo = await conn.getAccountInfo(userTokenAccountY);
  if (!userTokenYInfo) {
    ixes.push(
      createAssociatedTokenAccountInstruction(
        user,
        userTokenAccountY,
        user,
        tokenYMint,
        tokenYProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  ixes.push(web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }));

  const finalTx = new web3.Transaction();
  for (const ix of ixes) finalTx.add(ix);
  for (const ix of programTx.instructions) finalTx.add(ix);

  return finalTx;
}

export async function removeLiquidityTransactionHandler(
  input: RemoveLiquidityTransactionInput,
): Promise<RemoveLiquidityTransactionOutput> {
  const {
    user,
    tokenXMint,
    tokenYMint,
    tokenXProgramId,
    tokenYProgramId,
    minAmountX,
    minAmountY,
    lpTokensToBurn,
    provider,
  } = input;
  const program = createLiquidityProgram(IDL, provider);

  try {
    const tx = await removeLiquidity(
      new PublicKey(user),
      program,
      new PublicKey(tokenXMint),
      new PublicKey(tokenXProgramId),
      new PublicKey(tokenYMint),
      new PublicKey(tokenYProgramId),
      minAmountX,
      minAmountY,
      lpTokensToBurn,
    );
    return {
      success: true,
      transaction: tx,
    };
  } catch (error) {
    console.error("Error during liquidity addition:", error);
    return {
      success: false,
      transaction: null,
    };
  }
}
