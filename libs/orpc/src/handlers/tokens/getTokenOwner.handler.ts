"use server";

import { isSolanaAddress } from "@dex-web/utils";
import { PublicKey } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import type {
  GetTokenOwnerInput,
  GetTokenOwnerOutput,
} from "../../schemas/tokens/getTokenOwner.schema";

export const getTokenOwnerHandler = async (
  input: GetTokenOwnerInput,
): Promise<GetTokenOwnerOutput> => {
  const { address } = input;

  if (!isSolanaAddress(address)) {
    return {
      owner: "",
    };
  }

  const helius = getHelius();
  const connection = helius.connection;
  const tokenPubkey = new PublicKey(address);
  const accountInfo = await connection.getAccountInfo(tokenPubkey);
  if (!accountInfo) {
    return {
      owner: "",
    };
  }
  return { owner: accountInfo.owner.toString() };
};
