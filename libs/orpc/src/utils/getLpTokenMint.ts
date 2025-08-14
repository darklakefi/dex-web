import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { EXCHANGE_PROGRAM_ID } from "./solana";

const LIQUIDITY_SEED = "lp";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";

export async function getLpTokenMint(
  tokenAMint: string,
  tokenBMint: string,
): Promise<PublicKey> {
  // Sort mints canonically for consistent PDA derivation
  const mints = [new PublicKey(tokenAMint), new PublicKey(tokenBMint)].sort(
    (a, b) => a.toBuffer().compare(b.toBuffer()),
  );

  if (mints.length !== 2) {
    throw new Error("Invalid number of mints provided");
  }

  const mintA = mints[0]!;
  const mintB = mints[1]!;

  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(AMM_CONFIG_SEED), new BN(0).toArrayLike(Buffer, "le", 4)],
    EXCHANGE_PROGRAM_ID,
  );

  const [poolPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_SEED),
      ammConfig.toBuffer(),
      mintA.toBuffer(),
      mintB.toBuffer(),
    ],
    EXCHANGE_PROGRAM_ID,
  );

  const [lpMint] = PublicKey.findProgramAddressSync(
    [Buffer.from(LIQUIDITY_SEED), poolPubkey.toBuffer()],
    EXCHANGE_PROGRAM_ID,
  );

  return lpMint;
}
