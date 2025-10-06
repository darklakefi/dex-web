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
import { SOL_MINT } from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

export async function getTokenAccountsHandler({
  ownerAddress,
  mint,
}: GetTokenAccountsInput): Promise<GetTokenAccountsOutput> {
  const helius = getHelius();

  if (mint === SOL_MINT) {
    // Handle SOL native token specially
    const connection = helius.connection;
    const publicKey = new PublicKey(ownerAddress);
    const solBalance = await connection.getBalance(publicKey);

    // SOL has 9 decimals
    const solTokenAccount: TokenAccount = {
      address: ownerAddress,
      amount: solBalance,
      decimals: 9,
      mint: SOL_MINT,
      symbol: "SOL",
    };

    return {
      tokenAccounts: [solTokenAccount],
    };
  }

  const [getTokenAccountsResponse, tokenMetadataResponse] = await Promise.all([
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
  ]);

  const tokenAccountsData = getTokenAccountsResponse?.token_accounts;
  const hasTokenAccounts = (tokenAccountsData?.length ?? 0) > 0;

  const tokenMetadata = (tokenMetadataResponse as Token[])?.[0];
  const tokenAccounts = (
    hasTokenAccounts
      ? tokenAccountsData
      : [
          {
            address: ownerAddress,
            amount: 0,
            decimals: tokenMetadata?.decimals ?? 0,
            mint: mint ?? "",
            symbol: tokenMetadata?.symbol ?? "",
          },
        ]
  )?.map(
    (tokenAccount) =>
      ({
        address: tokenAccount.address ?? "",
        amount: tokenAccount.amount ?? 0,
        decimals: tokenMetadata?.decimals ?? 0,
        mint: tokenAccount.mint ?? "",
        symbol: tokenMetadata?.symbol ?? "",
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
