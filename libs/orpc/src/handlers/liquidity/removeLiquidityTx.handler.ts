import { BN, Program, web3 } from "@coral-xyz/anchor";
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

// TODO: Move to constants file
const POOL_RESERVE_SEED = "pool_reserve";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";
const LIQUIDITY_SEED = "lp";

async function removeLiquidity(
  user: PublicKey,
  program: Program<typeof IDL>,
  tokenXMint: PublicKey,
  tokenXProgramId: PublicKey,
  tokenYMint: PublicKey,
  tokenYProgramId: PublicKey,
  minAmountX: number,
  minAmountY: number,
  lpTokensToBurn: number,
): Promise<Transaction> {
  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(AMM_CONFIG_SEED), new BN(0).toArrayLike(Buffer, "le", 4)],
    program.programId,
  );

  // Find pool
  const [poolPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_SEED),
      ammConfig.toBuffer(),
      tokenXMint.toBuffer(),
      tokenYMint.toBuffer(),
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
    false,
    tokenXProgramId,
  );

  const userTokenAccountY = getAssociatedTokenAddressSync(
    tokenYMint,
    user,
    false,
    tokenYProgramId,
  );

  const userTokenAccountLp = getAssociatedTokenAddressSync(
    lpMint,
    user,
    false,
    TOKEN_PROGRAM_ID,
  );

  // Get pool reserve accounts
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

  // Create remove liquidity transaction
  const programTx = await program.methods
    .removeLiquidity(
      new BN(lpTokensToBurn),
      new BN(minAmountX),
      new BN(minAmountY),
    )
    .accountsPartial({
      pool: poolPubkey,
      poolTokenReserveX: poolTokenAccountX,
      poolTokenReserveY: poolTokenAccountY,
      tokenMintLp: lpMint,
      tokenMintX: tokenXMint,
      tokenMintXProgram: tokenXProgramId,
      tokenMintY: tokenYMint,
      tokenMintYProgram: tokenYProgramId,
      user: user,
      userTokenAccountLp: userTokenAccountLp,
      userTokenAccountX: userTokenAccountX,
      userTokenAccountY: userTokenAccountY,
    })
    .transaction();

  const conn = program.provider.connection;
  const ixes: web3.TransactionInstruction[] = [];

  // Conditionally create user ATAs for X and Y if missing
  const userTokenXInfo = await conn.getAccountInfo(userTokenAccountX);
  if (!userTokenXInfo) {
    ixes.push(
      createAssociatedTokenAccountInstruction(
        user, // payer
        userTokenAccountX,
        user, // owner
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
  const program = new Program(IDL, provider);

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
