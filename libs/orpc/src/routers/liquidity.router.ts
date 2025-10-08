import { getAddLiquidityReview } from "../procedures/liquidity/getAddLiquidityReview.procedure";
import { getUserLiquidity } from "../procedures/liquidity/getUserLiquidity.procedure";
import { removeLiquidityTransaction } from "../procedures/liquidity/removeLiquidityTransaction.procedure";
import { submitAddLiquidity } from "../procedures/liquidity/submitAddLiquidity.procedure";
import { submitWithdrawal } from "../procedures/liquidity/submitWithdrawal.procedure";
import { withdrawLiquidity } from "../procedures/liquidity/withdrawLiquidity.procedure";

export const liquidityRouter = {
  getAddLiquidityReview,
  getUserLiquidity,
  removeLiquidityTransaction,
  submitAddLiquidity,
  submitWithdrawal,
  withdrawLiquidity,
};

export type LiquidityRouter = typeof liquidityRouter;
