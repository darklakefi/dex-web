import { AnchorProvider, BN, type Program, web3 } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
	getAssociatedTokenAddressSync,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
	Keypair,
	PublicKey,
	TransactionInstruction,
	TransactionMessage,
	type Transaction,
	type VersionedTransaction,
} from "@solana/web3.js";
import IDL from "../../darklake-idl";
import { getHelius } from "../../getHelius";
import type {
  CreatePoolTransactionInput,
  CreatePoolTransactionOutput,
} from "../../schemas/pools/createPoolTransaction.schema";
import { getTokenProgramId } from "../../utils/solana";
import { createLiquidityProgram, ProgramFactory } from "@dex-web/core";

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
        return createAssociatedTokenAccountIdempotentInstruction(
          owner,
          ata,
          owner,
          mint,
          tokenProgram,
        );
      }
    }

async function createPool(
  user: PublicKey,
  program: Program<any>,
  tokenXMint: PublicKey,
  tokenXProgramId: PublicKey,
  tokenYMint: PublicKey,
  tokenYProgramId: PublicKey,
  depositAmountX: number,
  depositAmountY: number,
  connection: web3.Connection,
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

	const userTokenAccountLp = getAssociatedTokenAddressSync(
		lpMint,
		user,
		true,
		TOKEN_PROGRAM_ID,
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

  const initializePoolMethod = await program.methods.initializePool?.(new BN(depositAmountX), new BN(depositAmountY));

  if (!initializePoolMethod) {
    throw new Error("Program methods not available for initializePool");
  }

  const programTx = await initializePoolMethod
    ?.accountsPartial({
      createPoolFeeVault,
      tokenMintX: tokenXMint,
      tokenMintXProgram: tokenXProgramId,
      tokenMintY: tokenYMint,
      tokenMintYProgram: tokenYProgramId,
      user,
      userTokenAccountLp: userTokenAccountLp,
    })
    .transaction();

  const modifyComputeUnits = web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: 500_000,
  });

  const instructions = [modifyComputeUnits, ...ataInstructions];
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

  // Create validated program using factory (includes IDL validation and method checking)
	const program = createLiquidityProgram(IDL, provider);

  const tokenXProgramId = await getTokenProgramId(
    connection,
    new PublicKey(tokenXMint),
  );
  const tokenYProgramId = await getTokenProgramId(
    connection,
    new PublicKey(tokenYMint),
  );

  try {
    const vtx = await createPool(
      new PublicKey(user),
      program,
      new PublicKey(tokenXMint),
      new PublicKey(tokenXProgramId),
      new PublicKey(tokenYMint),
      new PublicKey(tokenYProgramId),
      depositAmountX,
      depositAmountY,
      connection,
    );

		const serializedTx = Buffer.from(vtx.serialize()).toString("base64");

		return {
			success: true,
			transaction: serializedTx,
		};
	} catch (error) {
		console.error("Error during liquidity addition:", error);
		return {
			success: false,
			transaction: null,
		};
	}
}
