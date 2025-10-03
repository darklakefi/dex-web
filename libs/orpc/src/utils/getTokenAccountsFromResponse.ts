import type { GetTokenAccountsResponse } from "helius-sdk/types/das";
import { isDefined } from "remeda";

export function getTokenAccountsFromResponse(
  response: GetTokenAccountsResponse,
) {
  return response.token_accounts
    ?.map((item) => ({
      address: item.address ?? "",
      amount: item.amount ?? 0,
      mint: item.mint ?? "",
    }))
    .filter((item) => isDefined(item.amount) && isDefined(item.mint))
    .filter(Boolean);
}
