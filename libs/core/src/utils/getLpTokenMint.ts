import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const LIQUIDITY_SEED = "lp";
const POOL_SEED = "pool";
const AMM_CONFIG_SEED = "amm_config";

export const EXCHANGE_PROGRAM_ID = new PublicKey(
  process.env.EXCHANGE_PROGRAM_ID ||
    "darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1",
);

export async function getLpTokenMint(
  tokenAMint: string,
  tokenBMint: string,
): Promise<PublicKey> {
  const mintAKey = new PublicKey(tokenAMint);
  const mintBKey = new PublicKey(tokenBMint);

  const comparison = mintAKey.toBuffer().compare(mintBKey.toBuffer());
  const [mintA, mintB] =
    comparison <= 0 ? [mintAKey, mintBKey] : [mintBKey, mintAKey];

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
