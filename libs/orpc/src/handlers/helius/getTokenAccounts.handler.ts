"use server";

import { ORPCError } from "@orpc/server";
import { PublicKey } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import type {
  GetTokenAccountsInput,
  GetTokenAccountsOutput,
} from "../../schemas/helius/getTokenAccounts.schema";
import type { Token } from "../../schemas/tokens";
import type { TokenAccount } from "../../schemas/tokens/tokenAccount.schema";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

const SOL_MINTS = [
  "So11111111111111111111111111111111111111111",
  "So11111111111111111111111111111111111111112",
];

const isSolMint = (mint: string | null): boolean => {
  if (!mint) return false;
  return SOL_MINTS.includes(mint);
};

export async function getTokenAccountsHandler({
  ownerAddress,
  mint,
}: GetTokenAccountsInput): Promise<GetTokenAccountsOutput> {
  const helius = getHelius();

  const [getTokenAccountsResponse, tokenMetadataResponse, nativeSolBalance] =
    await Promise.all([
      helius
        .getTokenAccounts({
          mint,
          options: {
            showZeroBalance: false,
          },
          owner: ownerAddress,
        })
        .catch(() => null),
      getTokenMetadataHandler({
        addresses: [mint ?? ""],
        returnAsObject: false,
      }).catch(() => null),
      isSolMint(mint ?? null)
        ? helius.connection
            .getBalance(new PublicKey(ownerAddress))
            .catch(() => 0)
        : Promise.resolve(0),
    ]);

  const tokenAccountsData = getTokenAccountsResponse?.token_accounts;
  const hasTokenAccounts = (tokenAccountsData?.length ?? 0) > 0;

  const tokenMetadata = (tokenMetadataResponse as Token[])?.[0];

  const isNativeSol = isSolMint(mint ?? null);

  let tokenAccounts: TokenAccount[];

  if (isNativeSol) {
    tokenAccounts = [
      {
        address: ownerAddress,
        amount: nativeSolBalance,
        decimals: tokenMetadata?.decimals ?? 9,
        mint: mint ?? "",
        symbol: tokenMetadata?.symbol ?? "",
      },
    ];
  } else if (hasTokenAccounts) {
    tokenAccounts = tokenAccountsData!.map(
      (tokenAccount) =>
        ({
          address: tokenAccount.address ?? "",
          amount: tokenAccount.amount ?? 0,
          decimals: tokenMetadata?.decimals ?? 0,
          mint: tokenAccount.mint ?? "",
          symbol: tokenMetadata?.symbol ?? "",
        }) satisfies TokenAccount,
    );
  } else {
    tokenAccounts = [
      {
        address: ownerAddress,
        amount: 0,
        decimals: tokenMetadata?.decimals ?? 0,
        mint: mint ?? "",
        symbol: tokenMetadata?.symbol ?? "",
      },
    ];
  }

  if (!tokenAccounts) {
    throw new ORPCError("NO_TOKEN_ACCOUNTS_FOUND");
  }

  const tokenAccountsOutput = {
    tokenAccounts,
  } satisfies GetTokenAccountsOutput;

  return tokenAccountsOutput;
}
