export function generateMockTxHash(): string {
  const hexChars = "0123456789abcdef";
  return Array.from(
    { length: 64 },
    () => hexChars[Math.floor(Math.random() * 16)],
  ).join("");
}
