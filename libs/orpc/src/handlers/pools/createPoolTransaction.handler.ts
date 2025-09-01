import { AnchorProvider, BN, Program, web3 } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import IDL from "../../darklake-idl";
import { getHelius } from "../../getHelius";
import type {
  CreatePoolTransactionInput,
  CreatePoolTransactionOutput,
} from "../../schemas/pools/createPoolTransaction.schema";

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

async function createPool(
  user: PublicKey,
  program: Program<typeof IDL>,
  tokenXMint: PublicKey,
  tokenXProgramId: PublicKey,
  tokenYMint: PublicKey,
  tokenYProgramId: PublicKey,
  depositAmountX: number,
  depositAmountY: number,
): Promise<Transaction> {
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

  const tx = await program.methods
    .initializePool(new BN(depositAmountX), new BN(depositAmountY))
    .accountsPartial({
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

  tx.add(modifyComputeUnits);

  return tx;
}

export async function createPoolTransactionHandler(
  input: CreatePoolTransactionInput,
): Promise<CreatePoolTransactionOutput> {
  const {
    user,
    tokenXMint,
    tokenYMint,
    tokenXProgramId,
    tokenYProgramId,
    depositAmountX,
    depositAmountY,
  } = input;

  const helius = getHelius();
  const connection = helius.connection;

  const dummyKeypair = Keypair.generate();
  const dummyWallet = {
    publicKey: dummyKeypair.publicKey,
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[],
    ): Promise<T[]> => txs,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T,
    ): Promise<T> => tx,
  };

  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
    skipPreflight: true,
  });

  const program = new Program(IDL, provider);

  try {
    const tx = await createPool(
      new PublicKey(user),
      program,
      new PublicKey(tokenXMint),
      new PublicKey(tokenXProgramId),
      new PublicKey(tokenYMint),
      new PublicKey(tokenYProgramId),
      depositAmountX,
      depositAmountY,
    );

    const serializedTx = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

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
