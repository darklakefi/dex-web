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
    tokenXMint: "BjkpJ2nwVAcqiJS7QvyFT7NmPiiKSER2jk3UZ357aeFk",
    tokenYMint: "FhvvMyddHzDQjopqL2cTmevcf225syJzXucKS1aQbyrd",
  },
  {
    tokenXMint: "4Hdpxzz6VXyTfNpcQxiGg97gYsSDjkqDsYNxNj42kmb6",
    tokenYMint: "JBjvyqUJX1dapQbzXqXj5vmnrT5AmdhjVdQHE9yxu1cU",
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
