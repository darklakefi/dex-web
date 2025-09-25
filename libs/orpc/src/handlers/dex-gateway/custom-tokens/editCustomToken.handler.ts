"use server";

import { getDexGatewayClient } from "../../../dex-gateway";
import type {
  EditCustomTokenInput,
  EditCustomTokenOutput,
} from "../../../schemas/dex-gateway/custom-tokens/editCustomToken.schema";

export async function editCustomTokenHandler(
  input: EditCustomTokenInput,
): Promise<EditCustomTokenOutput> {
  try {
    const client = await getDexGatewayClient();
    const res = await client.editCustomToken(input);
    return res as EditCustomTokenOutput;
  } catch (error) {
    console.error("EditCustomToken gRPC error:", error);
    return {
      message:
        error instanceof Error ? error.message : "Failed to edit custom token",
      success: false,
    } as EditCustomTokenOutput;
  }
}
