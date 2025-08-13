import { getAddLiquidityReviewHandler } from "../../handlers/pools/getAddLiquidityReview.handler";
import { getAddLiquidityReviewInputSchema } from "../../schemas/pools/getAddLiquidityReview.schema";
import { baseProcedure } from "../base.procedure";

export const getAddLiquidityReview = baseProcedure
  .input(getAddLiquidityReviewInputSchema)
  .handler(async ({ input }) => {
    return await getAddLiquidityReviewHandler(input);
  });
