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

  // shouldn't be needed but leaving as an example just in case
  // const recentBlockhash = await program.provider.connection.getLatestBlockhash();
  // tx.recentBlockhash = recentBlockhash.blockhash;

  tx.add(modifyComputeUnits);

  return tx;
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
  const {
    user,
    tokenXMint,
    tokenYMint,
    tokenXProgramId,
    tokenYProgramId,
    maxAmountX,
    maxAmountY,
    lpTokensToMint,
    provider,
  } = input;
  const program = new Program(IDL, provider);

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
      trackingId: input.trackingId,
      transaction: tx,
    };
  } catch (error) {
    console.error("Error during liquidity addition:", error);
    return {
      success: false,
      trackingId: input.trackingId,
      transaction: null,
    };
  }
}
