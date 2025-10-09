"use server";

import type { GetTokenMetadataListRequest } from "@dex-web/grpc-client";
import type {
  GetTokensWithPoolsInput,
  GetTokensWithPoolsOutput,
} from "../../schemas/tokens/getTokensWithPools.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import { getTokenMetadataListHandler } from "../dex-gateway/getTokenMetadataList.handler";
import { getAllPoolsHandler } from "../pools/getAllPools.handler";
import { getTokenMetadataHandler } from "./getTokenMetadata.handler";

function calculateRelevanceScore(
  token: Token,
  query: string,
  hasPool: boolean,
): number {
  const lowerQuery = query.toLowerCase();
  const lowerSymbol = token.symbol.toLowerCase();
  const lowerName = (token.name || "").toLowerCase();
  const lowerAddress = token.address.toLowerCase();

  let score = 0;

  if (hasPool) {
    score += 1000;
  }

  if (lowerSymbol === lowerQuery) {
    score += 500;
  } else if (lowerSymbol.startsWith(lowerQuery)) {
    score += 300;
  } else if (lowerSymbol.includes(lowerQuery)) {
    score += 100;
  }

  if (lowerName === lowerQuery) {
    score += 400;
  } else if (lowerName.startsWith(lowerQuery)) {
    score += 200;
  } else if (lowerName.includes(lowerQuery)) {
    score += 50;
  }

  if (lowerAddress.includes(lowerQuery)) {
    score += 10;
  }

  return score;
}

const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";

export const getTokensWithPoolsHandler = async (
  input: GetTokensWithPoolsInput,
): Promise<GetTokensWithPoolsOutput> => {
  const { limit = 50, query = "", offset = 0, onlyWithPools = false } = input;
  const trimmedQuery = query.trim();
  const page = Math.floor(offset / limit) + 1;

  const startTime = performance.now();

  const poolsResult = await getAllPoolsHandler({
    includeEmpty: false,
    search: undefined,
  });

  const poolTokenAddresses = Array.from(
    new Set(
      poolsResult.pools.flatMap((pool) => [pool.tokenXMint, pool.tokenYMint]),
    ),
  );

  const poolAddressSet = new Set(poolTokenAddresses);

  if (onlyWithPools && trimmedQuery.length === 0) {
    const poolTokens = await getTokenMetadataHandler({
      addresses: poolTokenAddresses,
      returnAsObject: false,
    });

    if (!Array.isArray(poolTokens)) {
      return {
        hasMore: false,
        poolTokenAddresses,
        tokens: [],
        total: 0,
      };
    }

    return {
      hasMore: false,
      poolTokenAddresses,
      tokens: poolTokens,
      total: poolTokens.length,
    };
  }

  const filterBy: GetTokenMetadataListRequest["filterBy"] =
    trimmedQuery.length === 0
      ? { case: undefined }
      : trimmedQuery.length > 30
        ? {
            case: "addressesList",
            value: {
              $typeName: "darklake.v1.TokenAddressesList",
              tokenAddresses: [trimmedQuery],
            },
          }
        : {
            case: "substring",
            value: trimmedQuery,
          };

  const gatewayInput: GetTokenMetadataListRequest = {
    $typeName: "darklake.v1.GetTokenMetadataListRequest",
    filterBy,
    pageNumber: page,
    pageSize: limit * 2,
  };

  const response = await getTokenMetadataListHandler(gatewayInput);

  const gatewayTokens: Token[] = response.tokens.map((token) => ({
    address: token.address,
    decimals: token.decimals,
    imageUrl: token.logoUri,
    name: token.name,
    symbol: token.symbol,
  }));

  if (trimmedQuery.length > 0) {
    const lowerQuery = trimmedQuery.toLowerCase();
    const hasWSolToken = gatewayTokens.some(
      (t) => t.address === WSOL_ADDRESS || t.symbol.toLowerCase() === "sol",
    );
    if (
      (lowerQuery === "sol" || lowerQuery === "wsol") &&
      !hasWSolToken &&
      (!onlyWithPools || poolAddressSet.has(WSOL_ADDRESS))
    ) {
      const wsolTokens = await getTokenMetadataHandler({
        addresses: [WSOL_ADDRESS],
        returnAsObject: false,
      });
      if (Array.isArray(wsolTokens) && wsolTokens.length > 0) {
        gatewayTokens.unshift(...wsolTokens);
      }
    }

    const filteredTokens = onlyWithPools
      ? gatewayTokens.filter((t) => poolAddressSet.has(t.address))
      : gatewayTokens;

    const scoredTokens = filteredTokens.map((token) => ({
      score: calculateRelevanceScore(
        token,
        trimmedQuery,
        poolAddressSet.has(token.address),
      ),
      token,
    }));

    scoredTokens.sort((a, b) => b.score - a.score);

    const sortedTokens = scoredTokens.slice(0, limit).map((item) => item.token);

    const duration = performance.now() - startTime;
    console.log(`[getTokensWithPools] Completed in ${duration.toFixed(2)}ms`);

    return {
      hasMore: response.tokens.length >= limit * 2,
      poolTokenAddresses,
      tokens: sortedTokens,
      total: sortedTokens.length,
    };
  }

  const gatewayAddresses = new Set(gatewayTokens.map((t) => t.address));
  const missingPoolTokens = poolTokenAddresses.filter(
    (addr) => !gatewayAddresses.has(addr),
  );

  if (missingPoolTokens.length > 0) {
    const poolTokens = await getTokenMetadataHandler({
      addresses: missingPoolTokens,
      returnAsObject: false,
    });

    if (Array.isArray(poolTokens)) {
      gatewayTokens.unshift(...poolTokens);
    }
  }

  const addressSet = new Set<string>();
  const uniqueTokens = gatewayTokens.filter((token) => {
    if (addressSet.has(token.address)) {
      return false;
    }
    addressSet.add(token.address);
    return true;
  });

  const tokensWithPools = uniqueTokens.filter((t) =>
    poolAddressSet.has(t.address),
  );
  const tokensWithoutPools = uniqueTokens.filter(
    (t) => !poolAddressSet.has(t.address),
  );

  const sortedTokens = [...tokensWithPools, ...tokensWithoutPools].slice(
    0,
    limit,
  );

  const duration = performance.now() - startTime;
  console.log(`[getTokensWithPools] Completed in ${duration.toFixed(2)}ms`);

  return {
    hasMore: response.tokens.length >= limit * 2,
    poolTokenAddresses,
    tokens: sortedTokens,
    total: sortedTokens.length,
  };
};
