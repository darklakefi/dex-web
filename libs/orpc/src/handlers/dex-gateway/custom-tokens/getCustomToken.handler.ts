"use server";

import { getDexGatewayClient } from "../../../dex-gateway";
import type {
  GetCustomTokenInput,
  GetCustomTokenOutput,
} from "../../../schemas/dex-gateway/custom-tokens/getCustomToken.schema";

export async function getCustomTokenHandler(
  input: GetCustomTokenInput,
): Promise<GetCustomTokenOutput> {
  try {
    const client = getDexGatewayClient();
    const res = await client.getCustomToken(input);
    return res as GetCustomTokenOutput;
  } catch (error) {
    console.error("GetCustomToken gRPC error:", error);
    return {} as GetCustomTokenOutput;
  }
}
