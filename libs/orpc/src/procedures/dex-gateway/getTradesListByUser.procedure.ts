import BigNumber from "bignumber.js";
import { getTradesListByUserHandler } from "../../handlers/dex-gateway/getTradesListByUser.handler";
import { getTradesListByUserInputSchema } from "../../schemas/dex-gateway/getTradesListByUser.schema";
import { baseProcedure } from "../base.procedure";

export const getTradesListByUser = baseProcedure
  .input(getTradesListByUserInputSchema)
  .handler(async ({ input }) => {
    const { user_address, limit, offset } = input;

    if (!user_address) {
      return {
        hasMore: false,
        totals: 0,
        trades: [],
      };
    }

    const response = await getTradesListByUserHandler({
      page_number: offset / limit + 1,
      page_size: limit,
      user_address,
    });

    const items = response?.data?.trades.map((trade) => ({
      amountIn: trade.amount_in,
      createdAt: BigNumber(trade.created_at).div(1_000).toNumber(),
      displayAmountIn: BigNumber(trade.amount_in)
        .div(10 ** 6)
        .toFixed(2)
        .toString(),
      displayMinimalAmountOut: BigNumber(trade.minimal_amount_out)
        .div(10 ** 6)
        .toFixed(2)
        .toString(),
      minimalAmountOut: trade.minimal_amount_out,
      orderId: trade.order_id,
      signature: trade.signature,
      status: trade.status,
      tokenMintX: trade.token_mint_x,
      tokenMintY: trade.token_mint_y,
      tradeId: trade.trade_id,
      updatedAt: trade.updated_at,
      userAddress: trade.user_address,
    }));

    return {
      hasMore:
        (response?.data?.total_pages ?? 0) >
        (response?.data?.current_page ?? 0),
      totals: (response?.data?.total_pages ?? 0) * limit,
      trades: items ?? [],
    };
  });
