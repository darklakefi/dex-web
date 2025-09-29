import { AnchorProvider, BN, type Program, web3, type Idl } from "@coral-xyz/anchor";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
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
import { getHelius } from "../../getHelius";
import type {
	CreateLiquidityTransactionInput,
	CreateLiquidityTransactionOutput,
} from "../../schemas/liquidity/createLiquidityTransaction.schema";
import { createLiquidityProgram } from "@dex-web/core";
import IDL from "../../darklake-idl";
import { getLPRateHandler } from "../pools/getLPRate.handler";

const POOL_RESERVE_SEED = "pool_reserve";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";
const LIQUIDITY_SEED = "lp";

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

async function createLiquidityTransaction(
	user: PublicKey,
	program: Program<Idl>,
	connection: web3.Connection,
	tokenXMint: PublicKey,
	tokenYMint: PublicKey,
	maxAmountX: string | number | bigint,
	maxAmountY: string | number | bigint,
	lpTokensToMint: string | number | bigint,
): Promise<VersionedTransaction> {
	const tokenXProgramId = await detectTokenProgram(connection, tokenXMint);
	const tokenYProgramId = await detectTokenProgram(connection, tokenYMint);

	try {
		await getMint(connection, tokenXMint, "confirmed", tokenXProgramId);
		await getMint(connection, tokenYMint, "confirmed", tokenYProgramId);
	} catch (error) {
		throw new Error(`Invalid mint/token program combination: ${error}`);
	}

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

	const lpTokenProgramId = TOKEN_PROGRAM_ID;

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

	const ataLpIx = await ensureAtaIx(connection, user, lpMint, lpTokenProgramId);
	if (ataLpIx) ataInstructions.push(ataLpIx);

	const [authority] = PublicKey.findProgramAddressSync(
		[Buffer.from("authority")],
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
		lpTokenProgramId,
	);

	const addLiquidityAccounts = {
		user,
		tokenMintX: tokenXMint,
		tokenMintY: tokenYMint,
		tokenMintLp: lpMint,
		pool: poolPubkey,
		ammConfig: ammConfig,
		authority,
		userTokenAccountX: userTokenAccountX,
		userTokenAccountY: userTokenAccountY,
		userTokenAccountLp: userTokenAccountLp,
		poolTokenReserveX: poolTokenAccountX,
		poolTokenReserveY: poolTokenAccountY,
		associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
		systemProgram: web3.SystemProgram.programId,
		tokenMintXProgram: tokenXProgramId,
		tokenMintYProgram: tokenYProgramId,
		tokenProgram: TOKEN_PROGRAM_ID,
	};

	const addLiquidityMethod = program.methods.add_liquidity?.(
		new BN(lpTokensToMint),
		maxAmountXBN,
		maxAmountYBN,
		null,
		null,
	);

	if (!addLiquidityMethod) {
		throw new Error("Program methods not available for add_liquidity");
	}

	const programTx = await addLiquidityMethod
		?.accountsPartial(addLiquidityAccounts)
		.transaction();

	const cuLimitIx = web3.ComputeBudgetProgram.setComputeUnitLimit({
		units: 400_000,
	});
	const cuPriceIx = web3.ComputeBudgetProgram.setComputeUnitPrice({
		microLamports: 50_000,
	});

	const instructions = [cuLimitIx, cuPriceIx, ...ataInstructions];
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

export async function createLiquidityTransactionHandler(
	input: CreateLiquidityTransactionInput,
): Promise<CreateLiquidityTransactionOutput> {
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

	// Create validated program using factory (includes IDL validation and method checking)
	const program = createLiquidityProgram(IDL, provider);

	const lpRate = await getLPRateHandler({
		slippage,
		tokenXAmount: Number(maxAmountX),
		tokenXMint,
		tokenYAmount: Number(maxAmountY),
		tokenYMint,
	});

	try {
		const vtx = await createLiquidityTransaction(
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
