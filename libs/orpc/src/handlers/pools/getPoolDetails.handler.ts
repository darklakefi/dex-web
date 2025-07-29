import type {
  GetPoolDetailsInput,
  GetPoolDetailsOutput,
} from "../../schemas/pools/getPoolDetails.schema";

const MOCK_POOLS = [
  {
    rateXtoY: 0.01,
    tokenXMint: "7gxzDSLbXqapoJ1e4WubzWUfFDeZZPENMAfCQeKfYyjT",
    tokenYMint: "9gXQd53kyGXB1juo7eKpfSTrvCW26u9LfUsPC9HH4nGQ",
  },
];

export function getPoolDetailsHandler(
  input: GetPoolDetailsInput,
): GetPoolDetailsOutput | null {
  const { tokenXMint, tokenYMint } = input;
  const pool = MOCK_POOLS.find(
    (pool) =>
      (pool.tokenXMint === tokenXMint && pool.tokenYMint === tokenYMint) ||
      (pool.tokenXMint === tokenYMint && pool.tokenYMint === tokenXMint),
  );

  if (!pool) {
    return null;
  }

  return pool;
}
