"use server";

import { MAINNET_POOLS, MOCK_POOLS } from "../../mocks/pool.mock";
import type {
  GetPoolDetailsInput,
  GetPoolDetailsOutput,
} from "../../schemas/pools/getPoolDetails.schema";
import { getPoolOnChain, type PoolAccount } from "../../utils/solana";

function getPoolOnLocalData(tokenXMint: string, tokenYMint: string) {
  const localDataPool =
    process.env.NETWORK === "2" ? MOCK_POOLS : MAINNET_POOLS;
  return localDataPool.find(
    (pool) =>
      (pool.tokenXMint === tokenXMint && pool.tokenYMint === tokenYMint) ||
      (pool.tokenXMint === tokenYMint && pool.tokenYMint === tokenXMint),
  );
}

async function savePoolToLocalData(pool: PoolAccount) {
  return {
    apr: 0,
    tokenXMint: pool.reserve_x.toBase58(),
    tokenXSymbol: pool.reserve_x.toBase58(),
    tokenYMint: pool.reserve_y.toBase58(),
    tokenYSymbol: pool.reserve_y.toBase58(),
  };
}

export async function getPoolDetailsHandler(
  input: GetPoolDetailsInput,
): Promise<GetPoolDetailsOutput | null> {
  const { tokenXMint, tokenYMint } = input;
  let pool = getPoolOnLocalData(tokenXMint, tokenYMint);
  console.log("Getting pool on local data", pool);

  if (!pool) {
    console.log("Getting pool on chain");
    const poolOnChain = await getPoolOnChain(tokenXMint, tokenYMint);
    if (poolOnChain) {
      pool = await savePoolToLocalData(poolOnChain);
    }
  }

  return pool ?? null;
}
