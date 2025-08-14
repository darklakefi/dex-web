import { getAddLiquidityReviewHandler } from "../../handlers/liquidity/getAddLiquidityReview.handler";
import { getAddLiquidityReviewInputSchema } from "../../schemas/liquidity/getAddLiquidityReview.schema";
import { baseProcedure } from "../base.procedure";

export const getAddLiquidityReview = baseProcedure
  .input(getAddLiquidityReviewInputSchema)
  .handler(async ({ input }) => {
    return await getAddLiquidityReviewHandler(input);
  });
