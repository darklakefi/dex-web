import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export function getSolanaWalletAdapterNetwork(): WalletAdapterNetwork {
  switch (process.env.NEXT_PUBLIC_NETWORK) {
    case "2":
      return WalletAdapterNetwork.Devnet;
    default:
      return WalletAdapterNetwork.Mainnet;
  }
}
