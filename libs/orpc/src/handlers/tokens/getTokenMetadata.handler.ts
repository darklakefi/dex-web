"use server";

import { create } from "@bufbuild/protobuf";
import type { TokenMetadata } from "@dex-web/grpc-client";
import { TokenMetadataPB } from "@dex-web/grpc-client";
import {
  fetchAllDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Connection } from "@solana/web3.js";
import { getDexGatewayClient } from "../../dex-gateway";
import { getHelius } from "../../getHelius";
import type {
  GetTokenMetadataInput,
  GetTokenMetadataOutput,
} from "../../schemas/tokens/getTokenMetadata.schema";
import type { Token } from "./../../schemas/tokens/token.schema";

const parseToken = (token: TokenMetadata): Token => ({
  address: token.address,
  decimals: token.decimals,
  imageUrl: token.logoUri,
  name: token.name,
  symbol: token.symbol,
});

export const getTokenMetadataHandler = async (
  input: GetTokenMetadataInput
): Promise<GetTokenMetadataOutput> => {
  const { addresses, returnAsObject } = input;

  if (!addresses || addresses.length === 0) {
    return returnAsObject ? ({} as Record<string, Token>) : [];
  }

  const grpcClient = await getDexGatewayClient();
  try {
    const { tokens } = await grpcClient.getTokenMetadataList({
      filterBy: {
        case: "addressesList",
        value: {
          tokenAddresses: addresses,
        },
      },
      pageNumber: 1,
      pageSize: addresses.length,
    });

    const notFoundTokens = addresses.filter(
      (address) => !tokens.some((token) => token.address === address)
    );
    if (notFoundTokens.length > 0) {
      const tokensFromChain = await fetchTokenMetadataFromChain(notFoundTokens);
      tokens.push(...tokensFromChain);
    }

    if (returnAsObject) {
      return tokens.reduce((acc, token) => {
        acc[token.address] = parseToken(token);
        return acc;
      }, {} as Record<string, Token>);
    }

    return tokens.map(parseToken);
  } catch (error) {
    console.error(error, "error");
    return returnAsObject ? ({} as Record<string, Token>) : [];
  }
};

async function fetchTokenMetadataFromChain(
  tokenAddress: string[]
): Promise<TokenMetadata[]> {
  const helius = getHelius();
  const rpc = new Connection(helius.endpoint);
  const umi = createUmi(rpc);
  umi.use(mplTokenMetadata());
  try {
    const digitalAsset = await fetchAllDigitalAsset(
      umi,
      tokenAddress.map((address) => publicKey(address))
    );
    return digitalAsset.map((asset) =>
      create(TokenMetadataPB, {
        address: asset.mint.publicKey.toString(),
        decimals: asset.mint.decimals,
        logoUri: "",
        name: asset.metadata.name,
        symbol: asset.metadata.symbol,
      })
    );
  } catch (_error) {
    return [];
  }
}
