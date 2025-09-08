"use server";

import { getDexGatewayClient } from "../../../dex-gateway";
import type {
  DeleteCustomTokenInput,
  DeleteCustomTokenOutput,
} from "../../../schemas/dex-gateway/custom-tokens/deleteCustomToken.schema";

export async function deleteCustomTokenHandler(
  input: DeleteCustomTokenInput,
): Promise<DeleteCustomTokenOutput> {
  try {
    const client = getDexGatewayClient();
    const res = await client.deleteCustomToken(input);
    return res as DeleteCustomTokenOutput;
  } catch (error) {
    console.error("DeleteCustomToken gRPC error:", error);
    return {
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete custom token",
      success: false,
    } as DeleteCustomTokenOutput;
  }
}
