import { getTokenBalance } from "../procedures/helius/getTokenBalance.procedure";
import { getTokenList } from "../procedures/helius/getTokenList.procedure";

export const heliusRouter = {
  getTokenBalance,
  getTokenList,
};
