import { checkLiquidityTransactionStatus } from "../procedures/liquidity/checkLiquidityTransactionStatus.procedure";
import { createLiquidityTransaction } from "../procedures/liquidity/createLiquidityTransaction.procedure";
import { getAddLiquidityReview } from "../procedures/liquidity/getAddLiquidityReview.procedure";
import { getUserLiquidity } from "../procedures/liquidity/getUserLiquidity.procedure";
import { removeLiquidityTransaction } from "../procedures/liquidity/removeLiquidityTransaction.procedure";
import { submitLiquidityTransaction } from "../procedures/liquidity/submitLiquidityTransaction.procedure";
import { submitWithdrawal } from "../procedures/liquidity/submitWithdrawal.procedure";
import { withdrawLiquidity } from "../procedures/liquidity/withdrawLiquidity.procedure";

export const liquidityRouter = {
  checkLiquidityTransactionStatus,
  createLiquidityTransaction,
  getAddLiquidityReview,
  getUserLiquidity,
  removeLiquidityTransaction,
  submitLiquidityTransaction,
  submitWithdrawal,
  withdrawLiquidity,
};

export type LiquidityRouter = typeof liquidityRouter;
