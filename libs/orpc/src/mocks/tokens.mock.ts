import type { PartialMessage } from "@bufbuild/protobuf";
import type { TokenMetadataPB } from "@dex-web/grpc-client";

export const tokensData = [
  {
    address: "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    decimals: 6,
    logoUri: "",
    name: "DuX",
    symbol: "DuX",
  },
  {
    address: "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
    decimals: 9,
    logoUri: "",
    name: "DukY",
    symbol: "DukY",
  },
] satisfies PartialMessage<TokenMetadataPB>[];

export const tokensDataMainnet = [
  {
    address: "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    decimals: 6,
    logoUri: "",
    name: "DuX",
    symbol: "DuX",
  },
  {
    address: "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
    decimals: 9,
    logoUri: "",
    name: "DukY",
    symbol: "DukY",
  },
  {
    address: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    decimals: 6,
    logoUri:
      "https://ipfs.io/ipfs/QmQr3Fz4h1etNsF7oLGMRHiCzhB5y9a7GjyodnF7zLHK1g",
    name: "Fartcoin",
    symbol: "Fartcoin",
  },
  {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    logoUri:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    name: "USD Coin",
    symbol: "USDC",
  },
] satisfies PartialMessage<TokenMetadataPB>[];
