import type {
  GetPoolDetailsInput,
  GetPoolDetailsOutput,
} from "../../schemas/pools/getPoolDetails.schema";

const MOCK_POOLS = [
  {
    tokenXMint: "7gxzDSLbXqapoJ1e4WubzWUfFDeZZPENMAfCQeKfYyjT",
    tokenYMint: "9gXQd53kyGXB1juo7eKpfSTrvCW26u9LfUsPC9HH4nGQ",
  },
];

const MAINNET_POOLS = [
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
