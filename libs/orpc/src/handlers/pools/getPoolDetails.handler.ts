import type {
  GetPoolDetailsInput,
  GetPoolDetailsOutput,
} from "../../schemas/pools/getPoolDetails.schema";

const MOCK_POOLS = [
  {
    rateXtoY: 0.01,
    tokenXMint: "DPFczWRUhvXK3F3kZ3qFiQCcoFjo7VHEjL6RK5wKEiVx",
    tokenYMint: "EipJWba86jgVAvZQNBzkLoCzzpf73y3qecDQoNxBN9MM",
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
