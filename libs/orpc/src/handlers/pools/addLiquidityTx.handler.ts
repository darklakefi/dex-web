import { BN, Program, web3 } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, type Transaction } from "@solana/web3.js";
import IDL from "../../darklake-idl";
import type {
  AddLiquidityTxInput,
  AddLiquidityTxOutput,
} from "../../schemas/pools/addLiquidityTx.schema";

// TODO: Move to constants file
const POOL_RESERVE_SEED = "pool_reserve";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";
const LIQUIDITY_SEED = "lp";

async function addLiquidity(
  user: PublicKey,
  program: Program<typeof IDL>,
  tokenXMint: PublicKey,
  tokenXProgramId: PublicKey,
  tokenYMint: PublicKey,
  tokenYProgramId: PublicKey,
  amountX: number,
  amountY: number,
  lpTokensToMint: number,
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

  // Create add liquidity transaction
  const tx = await program.methods
    .addLiquidity(new BN(lpTokensToMint), new BN(amountX), new BN(amountY))
    .accountsPartial({
      pool: poolPubkey,
      poolTokenReserveX: poolTokenAccountX,
      poolTokenReserveY: poolTokenAccountY,
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
    .transaction();

  // Add compute budget instruction
  const modifyComputeUnits = web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: 250_000,
  });
  tx.add(modifyComputeUnits);

  return tx;
}

// Tries to mint exactly lpTokensToMint at the same time not exceeding neither maxAmountX nor maxAmountY (if it does it will fail)
export async function addLiquidityTxHandler(
  input: AddLiquidityTxInput,
): Promise<AddLiquidityTxOutput> {
  const {
    user,
    tokenXMint,
    tokenYMint,
    tokenXProgramId,
    tokenYProgramId,
    maxAmountX,
    maxAmountY,
    lpTokensToMint,
  } = input;
  const program = new Program(IDL);

  try {
    const tx = await addLiquidity(
      new PublicKey(user),
      program,
      new PublicKey(tokenXMint),
      new PublicKey(tokenXProgramId),
      new PublicKey(tokenYMint),
      new PublicKey(tokenYProgramId),
      maxAmountX,
      maxAmountY,
      lpTokensToMint,
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
