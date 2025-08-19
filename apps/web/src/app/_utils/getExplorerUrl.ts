type ExplorerUrlParams =
  | { address: string; tx?: never }
  | { address?: never; tx: string };

export function getExplorerUrl(input: ExplorerUrlParams) {
  const type = input.tx ? "tx" : "address";
  const cluster =
    process.env.NEXT_PUBLIC_NETWORK === "2" ? "?cluster=devnet" : "";

  return `${process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.solana.com"}/${type}/${input.address || input.tx}${cluster}`;
}
