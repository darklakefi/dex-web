import type { GetTransactionStatusInput } from "../../schemas";

export async function getTransactionStatusHandler(
  input: GetTransactionStatusInput,
) {
  const url = `/api/transactions/${input.trackingId}/status${input.tradeId ? `?tradeId=${input.tradeId}` : ""}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch transaction status: ${response.statusText}`,
    );
  }

  return await response.json();
}
