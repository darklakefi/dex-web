import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  type Transaction,
  type TransactionInstruction,
  TransactionMessage,
  type VersionedTransaction,
} from "@solana/web3.js";
import IDL from "../../darklake-idl";
import { getHelius } from "../../getHelius";
import type {
  AddLiquidityTxInput,
  AddLiquidityTxOutput,
} from "../../schemas/pools/addLiquidityTx.schema";
import { getLPRateHandler } from "../pools/getLPRate.handler";

// TODO: Move to constants file
const POOL_RESERVE_SEED = "pool_reserve";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";
const LIQUIDITY_SEED = "lp";

// Utility functions
async function toBaseUnits(
  connection: web3.Connection,
  mint: PublicKey,
  uiAmount: string | number | bigint,
  tokenProgram: PublicKey,
): Promise<BN> {
  const info = await getMint(connection, mint, "confirmed", tokenProgram);
  const decimals = info.decimals;
  const asStr = uiAmount.toString();
  const [i, f = ""] = asStr.split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return new BN(i)
    .mul(new BN(10).pow(new BN(decimals)))
    .add(new BN(frac || "0"));
}

async function detectTokenProgram(
  connection: web3.Connection,
  mint: PublicKey,
): Promise<PublicKey> {
  try {
    await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
    return TOKEN_2022_PROGRAM_ID;
  } catch {
    return TOKEN_PROGRAM_ID;
  }
}

async function ensureAtaIx(
  connection: web3.Connection,
  owner: PublicKey,
  mint: PublicKey,
  tokenProgram: PublicKey,
): Promise<TransactionInstruction | null> {
  const ata = getAssociatedTokenAddressSync(mint, owner, false, tokenProgram);
  try {
    await getAccount(connection, ata, "confirmed", tokenProgram);
    return null;
  } catch {
    return createAssociatedTokenAccountIdempotentInstruction(
      owner,
      ata,
      owner,
      mint,
      tokenProgram,
    );
  }
}

async function addLiquidity(
  user: PublicKey,
  program: Program<typeof IDL>,
  connection: web3.Connection,
  tokenXMint: PublicKey,
  tokenYMint: PublicKey,
  maxAmountX: string | number | bigint,
  maxAmountY: string | number | bigint,
  lpTokensToMint: string | number | bigint,
): Promise<VersionedTransaction> {
  // Detect token programs for each mint
  const tokenXProgramId = await detectTokenProgram(connection, tokenXMint);
  const tokenYProgramId = await detectTokenProgram(connection, tokenYMint);

  // Validate mint/program coherence
  try {
    await getMint(connection, tokenXMint, "confirmed", tokenXProgramId);
    await getMint(connection, tokenYMint, "confirmed", tokenYProgramId);
  } catch (error) {
    throw new Error(`Invalid mint/token program combination: ${error}`);
  }

  // Sort mints canonically for consistent PDA derivation
  const [mintA, mintB] = [tokenXMint, tokenYMint].sort((a, b) =>
    a.toBuffer().compare(b.toBuffer()),
  );

  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(AMM_CONFIG_SEED), new BN(0).toArrayLike(Buffer, "le", 4)],
    program.programId,
  );

  const [poolPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_SEED),
      ammConfig.toBuffer(),
      mintA?.toBuffer() ?? Buffer.from([]),
      mintB?.toBuffer() ?? Buffer.from([]),
    ],
    program.programId,
  );

  const [lpMint] = PublicKey.findProgramAddressSync(
    [Buffer.from(LIQUIDITY_SEED), poolPubkey.toBuffer()],
    program.programId,
  );

  // LP token program (usually TOKEN_PROGRAM_ID)
  const lpTokenProgramId = TOKEN_PROGRAM_ID;

  // Convert amounts to base units
  const maxAmountXBN = await toBaseUnits(
    connection,
    tokenXMint,
    maxAmountX,
    tokenXProgramId,
  );
  const maxAmountYBN = await toBaseUnits(
    connection,
    tokenYMint,
    maxAmountY,
    tokenYProgramId,
  );
  const lpTokensToMintBN = await toBaseUnits(
    connection,
    lpMint,
    lpTokensToMint,
    lpTokenProgramId,
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

  // Create ATA instructions if needed
  const ataInstructions: TransactionInstruction[] = [];

  const ataXIx = await ensureAtaIx(
    connection,
    user,
    tokenXMint,
    tokenXProgramId,
  );
  if (ataXIx) ataInstructions.push(ataXIx);

  const ataYIx = await ensureAtaIx(
    connection,
    user,
    tokenYMint,
    tokenYProgramId,
  );
  if (ataYIx) ataInstructions.push(ataYIx);

  const ataLpIx = await ensureAtaIx(connection, user, lpMint, lpTokenProgramId);
  if (ataLpIx) ataInstructions.push(ataLpIx);

  // Build program instruction
  const programIx = await program.methods
    .addLiquidity(lpTokensToMintBN, maxAmountXBN, maxAmountYBN)
    .accounts({
      poolTokenReserveX: poolTokenAccountX,
      poolTokenReserveY: poolTokenAccountY,
      tokenMintX: tokenXMint,
      tokenMintXProgram: tokenXProgramId,
      tokenMintY: tokenYMint,
      tokenMintYProgram: tokenYProgramId,
      user,
    })
    .instruction();

  // Compute budget instructions (put first)
  const cuLimitIx = web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000,
  });
  const cuPriceIx = web3.ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 50_000,
  });

  // Build versioned transaction
  const { blockhash } = await connection.getLatestBlockhash();
  const instructions = [cuLimitIx, cuPriceIx, ...ataInstructions, programIx];

  const message = new TransactionMessage({
    instructions,
    payerKey: user,
    recentBlockhash: blockhash,
  }).compileToV0Message();

  return new web3.VersionedTransaction(message);
}

// Usage example
/*
  // this is optional if you don't have access to a wallet here
  const dummy = Keypair.generate();
  const dummyWallet = {
    publicKey: dummy.publicKey,
    signTransaction: async (tx: any) => tx,      // no-op
    signAllTransactions: async (txs: any[]) => txs, // no-op
  };

  // this or the dummyWallet
  const wallet = useWallet();

  const provider = new AnchorProvider(
    helius.connection,
    wallet, // or dummyWallet
  );

  const res = await addLiquidityTxHandler({
    lpTokensToMint: 10,
    maxAmountX: 1000,
    maxAmountY: 1000,
    tokenXMint: 'DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX',
    tokenXProgramId: 'DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX',
    tokenYMint: 'DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX',
    tokenYProgramId: 'DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX',
    user: 'browser-wallet-pubkey',
    provider,
  });


  if (!res.success || !res.transaction) {
    return; // failure
  }

  const tx = res.transaction;
  tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash
  tx.feePayer = wallet.publicKey

  const signedTx = await wallet?.signTransaction(res.transaction)
  const rawTransaction = signedTx.serialize()
  await provider.connection.sendRawTransaction(rawTransaction)
*/

// Tries to mint exactly lpTokensToMint at the same time not exceeding neither maxAmountX nor maxAmountY (if it does it will fail)
export async function addLiquidityTxHandler(
  input: AddLiquidityTxInput,
): Promise<AddLiquidityTxOutput> {
  const { user, tokenXMint, tokenYMint, maxAmountX, maxAmountY, slippage } =
    input;

  const helius = getHelius();
  const connection = helius.connection;

  const userWallet = {
    publicKey: new PublicKey(user),
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[],
    ): Promise<T[]> => txs,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T,
    ): Promise<T> => tx,
  };

  const provider = new AnchorProvider(connection, userWallet, {
    commitment: "confirmed",
  });

  const program = new Program(IDL, provider);

  const lpRate = await getLPRateHandler({
    slippage,
    tokenXAmount: Number(maxAmountX),
    tokenXMint,
    tokenYAmount: Number(maxAmountY),
    tokenYMint,
  });

  try {
    const vtx = await addLiquidity(
      new PublicKey(user),
      program,
      connection,
      new PublicKey(tokenXMint),
      new PublicKey(tokenYMint),
      maxAmountX,
      maxAmountY,
      lpRate.estimatedLPTokens,
    );

    const serializedTx = Buffer.from(vtx.serialize()).toString("base64");

    return {
      success: true,
      transaction: serializedTx,
    };
  } catch (error) {
    console.error("Error during liquidity addition:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      error: errorMessage,
      success: false,
      transaction: null,
    };
  }
}
