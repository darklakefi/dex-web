import type { DAS } from "helius-sdk";
import { isDefined } from "remeda";

export function getTokenAccountsFromResponse(
  response: DAS.GetTokenAccountsResponse,
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
