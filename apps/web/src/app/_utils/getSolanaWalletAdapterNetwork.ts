import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export function getSolanaWalletAdapterNetwork(): WalletAdapterNetwork {
  switch (process.env.NEXT_PUBLIC_SOLANA_NETWORK) {
    case "mainnet":
      return WalletAdapterNetwork.Mainnet;
    case "devnet":
      return WalletAdapterNetwork.Devnet;
    case "testnet":
      return WalletAdapterNetwork.Testnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
}
