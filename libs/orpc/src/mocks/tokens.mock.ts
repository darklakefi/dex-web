import { create } from "@bufbuild/protobuf";
import { TokenMetadataSchema } from "@dex-web/grpc-client";

export const tokensData = [
  create(TokenMetadataSchema, {
    address: "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    decimals: 6,
    logoUri: "",
    name: "DuX",
    symbol: "DuX",
  }),
  create(TokenMetadataSchema, {
    address: "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
    decimals: 9,
    logoUri: "",
    name: "DukY",
    symbol: "DukY",
  }),
];

export const tokensDataMainnet = [
  create(TokenMetadataSchema, {
    address: "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    decimals: 6,
    logoUri: "",
    name: "DuX",
    symbol: "DuX",
  }),
  create(TokenMetadataSchema, {
    address: "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
    decimals: 9,
    logoUri: "",
    name: "DukY",
    symbol: "DukY",
  }),
  create(TokenMetadataSchema, {
    address: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    decimals: 6,
    logoUri:
      "https://ipfs.io/ipfs/QmQr3Fz4h1etNsF7oLGMRHiCzhB5y9a7GjyodnF7zLHK1g",
    name: "Fartcoin",
    symbol: "Fartcoin",
  }),
  create(TokenMetadataSchema, {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    logoUri:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    name: "USD Coin",
    symbol: "USDC",
  }),
];
