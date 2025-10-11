import {
  AnchorProvider,
  BN,
  type Idl,
  type Program,
  web3,
} from "@coral-xyz/anchor";
import { createLiquidityProgram } from "@dex-web/core";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
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
  CreatePoolTransactionInput,
  CreatePoolTransactionOutput,
} from "../../schemas/pools/createPoolTransaction.schema";
import { WSOL_MINT } from "../../utils/solana";

const POOL_RESERVE_SEED = "pool_reserve";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";
const LIQUIDITY_SEED = "lp";

const createPoolFeeVaultDevnet = new PublicKey(
  "6vUjEKC5mkiDMdMhkxV8SYzPQAk39aPKbjGataVnkUss",
);
const createPoolFeeVaultMainnet = new PublicKey(
  "HNQdnRgtnsgcx7E836nZ1JwrQstWBEJMnRVy8doY366A",
);

const createPoolFeeVault =
  process.env.NEXT_PUBLIC_NETWORK === "2"
    ? createPoolFeeVaultDevnet
    : createPoolFeeVaultMainnet;

async function ensureAtaIx(
  connection: web3.Connection,
  owner: PublicKey,
  mint: PublicKey,
  tokenProgram: PublicKey,
): Promise<TransactionInstruction | null> {
  const ata = getAssociatedTokenAddressSync(mint, owner, true, tokenProgram);
  try {
    await getAccount(connection, ata, "confirmed", tokenProgram);
    return null;
  } catch {
    const isNativeWsol = mint.toBase58() === WSOL_MINT;
    const ix = isNativeWsol
      ? createAssociatedTokenAccountInstruction(
          owner,
          ata,
          owner,
          mint,
          tokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        )
      : createAssociatedTokenAccountIdempotentInstruction(
          owner,
          ata,
          owner,
          mint,
          tokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
    console.log("Creating ATA instruction:", {
      ata: ata.toBase58(),
      keys: ix.keys.map((k) => ({
        isSigner: k.isSigner,
        isWritable: k.isWritable,
        pubkey: k.pubkey.toBase58(),
      })),
      mint: mint.toBase58(),
      mode: isNativeWsol ? "legacy-create" : "idempotent-create",
      tokenProgram: tokenProgram.toBase58(),
    });
    return ix;
  }
}

async function createPool(
  user: PublicKey,
  program: Program<Idl>,
  tokenXMint: PublicKey,
  tokenXProgramId: PublicKey,
  tokenYMint: PublicKey,
  tokenYProgramId: PublicKey,
  depositAmountX: string,
  depositAmountY: string,
  connection: web3.Connection,
  options?: {
    wrapNative?: {
      xLamports?: string;
      yLamports?: string;
    };
  },
): Promise<VersionedTransaction> {
  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(AMM_CONFIG_SEED), new BN(0).toArrayLike(Buffer, "le", 4)],
    program.programId,
  );

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

  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    program.programId,
  );

  const initializePoolMethod = await program.methods.initializePool?.(
    new BN(depositAmountX),
    new BN(depositAmountY),
    null,
  );

  if (!initializePoolMethod) {
    throw new Error("Program methods not available for initializePool");
  }

  const programTx = await initializePoolMethod
    ?.accountsPartial({
      ammConfig,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      authority,
      createPoolFeeVault,
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
    .transaction();

  const modifyComputeUnits = web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: 500_000,
  });

  const instructions = [modifyComputeUnits, ...ataInstructions];

  // If user selected native SOL for either side, wrap the SOL before program call
  if (options?.wrapNative?.xLamports) {
    const lamports = Number(options.wrapNative.xLamports);
    if (lamports > 0) {
      instructions.push(
        web3.SystemProgram.transfer({
          fromPubkey: user,
          lamports,
          toPubkey: userTokenAccountX,
        }),
      );
      instructions.push(
        createSyncNativeInstruction(userTokenAccountX, tokenXProgramId),
      );
    }
  }

  if (options?.wrapNative?.yLamports) {
    const lamports = Number(options.wrapNative.yLamports);
    if (lamports > 0) {
      instructions.push(
        web3.SystemProgram.transfer({
          fromPubkey: user,
          lamports,
          toPubkey: userTokenAccountY,
        }),
      );
      instructions.push(
        createSyncNativeInstruction(userTokenAccountY, tokenYProgramId),
      );
    }
  }
  for (const ix of programTx.instructions) {
    instructions.push(ix);
  }

  const { blockhash } = await connection.getLatestBlockhash();

  const { getOptionalLookupTable } = await import("../../utils/lookupTable");
  const lookupTable = await getOptionalLookupTable(connection);

  const message = new TransactionMessage({
    instructions,
    payerKey: user,
    recentBlockhash: blockhash,
  }).compileToV0Message(lookupTable ? [lookupTable] : []);

  return new web3.VersionedTransaction(message);
}

export async function createPoolTransactionHandler(
  input: CreatePoolTransactionInput,
): Promise<CreatePoolTransactionOutput> {
  const { user, tokenXMint, tokenYMint, depositAmountX, depositAmountY } =
    input;

  // Normalize SOL to WSOL for pool operations
  const { normalizeTokenMintForPool, SOL_MINT } = await import(
    "../../utils/solana"
  );
  const normalizedTokenXMint = normalizeTokenMintForPool(tokenXMint);
  const normalizedTokenYMint = normalizeTokenMintForPool(tokenYMint);

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

  const program = createLiquidityProgram(IDL, provider);

  // Detect token program IDs robustly by probing mints under both programs
  async function detectTokenProgram(mint: PublicKey): Promise<PublicKey> {
    try {
      await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);
      return TOKEN_PROGRAM_ID;
    } catch {
      try {
        await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
        return TOKEN_2022_PROGRAM_ID;
      } catch {
        // Fall back to classic program to avoid hard failure; ATA creation will still fail if wrong
        return TOKEN_PROGRAM_ID;
      }
    }
  }

  const tokenXProgramId = await detectTokenProgram(
    new PublicKey(normalizedTokenXMint),
  );
  const tokenYProgramId = await detectTokenProgram(
    new PublicKey(normalizedTokenYMint),
  );

  console.log("=== Token Program IDs ===");
  console.log(
    `Token X: ${normalizedTokenXMint} -> ${tokenXProgramId.toBase58()}`,
  );
  console.log(
    `Token Y: ${normalizedTokenYMint} -> ${tokenYProgramId.toBase58()}`,
  );

  try {
    const vtx = await createPool(
      new PublicKey(user),
      program,
      new PublicKey(normalizedTokenXMint),
      new PublicKey(tokenXProgramId),
      new PublicKey(normalizedTokenYMint),
      new PublicKey(tokenYProgramId),
      depositAmountX,
      depositAmountY,
      connection,
      {
        wrapNative: {
          xLamports: tokenXMint === SOL_MINT ? depositAmountX : undefined,
          yLamports: tokenYMint === SOL_MINT ? depositAmountY : undefined,
        },
      },
    );

    // Simulate transaction before returning
    console.log("=== Simulating pool creation transaction ===");
    try {
      const simulation = await connection.simulateTransaction(vtx, {
        sigVerify: false,
      });

      console.log("Simulation result:", {
        err: simulation.value.err,
        logs: simulation.value.logs,
        unitsConsumed: simulation.value.unitsConsumed,
      });

      if (simulation.value.err) {
        console.error("Simulation failed with error:", simulation.value.err);
        console.error("Simulation logs:", simulation.value.logs);
        throw new Error(
          `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
        );
      }
    } catch (simError) {
      console.error("Simulation error:", simError);
      throw simError;
    }

    const serializedTx = Buffer.from(vtx.serialize()).toString("base64");

    return {
      success: true,
      transaction: serializedTx,
    };
  } catch (error) {
    console.error("Error during pool creation:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes("maximum depth")) {
        errorMessage = `Account resolution failed: ${errorMessage}. This may be due to circular account dependencies or incorrect PDA derivation.`;
      }
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
