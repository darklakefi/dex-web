"use server";

import { getDexGatewayClient } from "../../../dex-gateway";
import type { GetCustomTokensOutput } from "../../../schemas/dex-gateway/custom-tokens/getCustomTokens.schema";

export async function getCustomTokensHandler(): Promise<GetCustomTokensOutput> {
  try {
    const client = getDexGatewayClient();
    const res = await client.getCustomTokens({});
    return res as GetCustomTokensOutput;
  } catch (error) {
    console.error("GetCustomTokens gRPC error:", error);
    return { tokens: [] } as GetCustomTokensOutput;
  }
}
