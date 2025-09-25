"use server";

import { getDexGatewayClient } from "../../../dex-gateway";
import type {
  CreateCustomTokenInput,
  CreateCustomTokenOutput,
} from "../../../schemas/dex-gateway/custom-tokens/createCustomToken.schema";

export async function createCustomTokenHandler(
  input: CreateCustomTokenInput,
): Promise<CreateCustomTokenOutput> {
  try {
    const client = await getDexGatewayClient();
    const res = await client.createCustomToken(input);
    return res as CreateCustomTokenOutput;
  } catch (error) {
    console.error("CreateCustomToken gRPC error:", error);
    return {
      message:
        error instanceof Error
          ? error.message
          : "Failed to create custom token",
      success: false,
    } as CreateCustomTokenOutput;
  }
}
