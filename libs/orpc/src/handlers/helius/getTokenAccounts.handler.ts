"use server";

import { ORPCError } from "@orpc/server";
import { getHelius } from "../../getHelius";
import type {
  GetTokenAccountsInput,
  GetTokenAccountsOutput,
} from "../../schemas/helius/getTokenAccounts.schema";
import type { TokenAccount } from "../../schemas/tokens/tokenAccount.schema";

export async function getTokenAccountsHandler({
  ownerAddress,
  mint,
}: GetTokenAccountsInput): Promise<GetTokenAccountsOutput> {
  const helius = getHelius();

  const [getTokenAccountsResponse, tokenMetadata] = await Promise.all([
    helius.rpc
      .getTokenAccounts({
        mint: mint,
        owner: ownerAddress,
        page: 1,
      })
      .catch(() => null),
    helius.rpc
      .getAsset({
        id: mint ?? "",
      })
      .catch(() => null),
  ]);

  const hasTokenAccounts =
    (getTokenAccountsResponse?.token_accounts?.length ?? 0) > 0;

  const tokenAccounts = (
    hasTokenAccounts
      ? getTokenAccountsResponse?.token_accounts
      : [
          {
            address: ownerAddress,
            amount: 0,
            decimals: tokenMetadata?.token_info?.decimals ?? 0,
            mint: mint ?? "",
            symbol: tokenMetadata?.content?.metadata?.symbol ?? "",
          },
        ]
  )?.map(
    (tokenAccount) =>
      ({
        address: tokenAccount.address ?? "",
        amount: tokenAccount.amount ?? 0,
        balance: tokenAccount.amount ?? 0,
        decimals: tokenMetadata?.token_info?.decimals ?? 0,
        mint: tokenAccount.mint ?? "",
        symbol: tokenMetadata?.content?.metadata?.symbol ?? "",
      }) satisfies TokenAccount,
  );

  if (!tokenAccounts) {
    throw new ORPCError("NO_TOKEN_ACCOUNTS_FOUND");
  }

  const tokenAccountsOutput = {
    tokenAccounts,
  } satisfies GetTokenAccountsOutput;

  return tokenAccountsOutput;
}
