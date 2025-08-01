import type {
  GetPoolDetailsInput,
  GetPoolDetailsOutput,
} from "../../schemas/pools/getPoolDetails.schema";

export const MOCK_POOLS = [
  {
    tokenXMint: "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    tokenYMint: "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
  },
];

export const MAINNET_POOLS = [
  {
    tokenXMint: "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    tokenYMint: "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
  },
];

export function getPoolDetailsHandler(
  input: GetPoolDetailsInput,
): GetPoolDetailsOutput | null {
  const { tokenXMint, tokenYMint } = input;
  const rawData = process.env.NETWORK === "2" ? MOCK_POOLS : MAINNET_POOLS;
  const pool = rawData.find(
    (pool) =>
      (pool.tokenXMint === tokenXMint && pool.tokenYMint === tokenYMint) ||
      (pool.tokenXMint === tokenYMint && pool.tokenYMint === tokenXMint),
  );

  if (!pool) {
    return null;
  }

  return pool;
}
