"use server";
import { getLpTokenMint } from "@dex-web/core";
import { PublicKey } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import type {
  GetUserLiquidityInput,
  GetUserLiquidityOutput,
} from "../../schemas/pools/getUserLiquidity.schema";
import { LP_TOKEN_DECIMALS } from "../../utils/solana";
export async function getUserLiquidityHandler({
  ownerAddress,
  tokenXMint,
  tokenYMint,
}: GetUserLiquidityInput): Promise<GetUserLiquidityOutput> {
  const helius = getHelius();
  try {
    const lpTokenMint = await getLpTokenMint(tokenXMint, tokenYMint);
    const lpTokenMintString = lpTokenMint.toBase58();
    const tokenAccountsResponse = await helius
      .getTokenAccounts({
        mint: lpTokenMintString,
        options: {
          showZeroBalance: false,
        },
        owner: ownerAddress,
      })
      .catch(() => null);
    const tokenAccounts = tokenAccountsResponse?.token_accounts || [];
    let totalLpBalance = 0;
    for (const account of tokenAccounts) {
      if (account.amount) {
        totalLpBalance += account.amount;
      }
    }
    const lpTokenBalance = totalLpBalance / 10 ** LP_TOKEN_DECIMALS;
    const hasLiquidity = lpTokenBalance > 0;
    const result: GetUserLiquidityOutput = {
      decimals: LP_TOKEN_DECIMALS,
      hasLiquidity,
      lpTokenBalance,
      lpTokenMint: lpTokenMintString,
    };
    return result;
  } catch (_error) {
    const lpTokenMint = await getLpTokenMint(tokenXMint, tokenYMint).catch(
      () => new PublicKey("11111111111111111111111111111111"),
    );
    return {
      decimals: LP_TOKEN_DECIMALS,
      hasLiquidity: false,
      lpTokenBalance: 0,
      lpTokenMint: lpTokenMint.toBase58(),
    };
  }
}
