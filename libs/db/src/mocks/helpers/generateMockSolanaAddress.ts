export function generateMockSolanaAddress(): string {
  const base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from(
    { length: 44 },
    () => base58[Math.floor(Math.random() * base58.length)],
  ).join("");
}
