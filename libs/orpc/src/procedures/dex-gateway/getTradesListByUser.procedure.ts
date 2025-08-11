import BigNumber from "bignumber.js";
import { getTradesListByUserHandler } from "../../handlers/dex-gateway/getTradesListByUser.handler";
import { getTradesListByUserInputSchema } from "../../schemas/dex-gateway/getTradesListByUser.schema";
import { baseProcedure } from "../base.procedure";

export const getTradesListByUser = baseProcedure
  .input(getTradesListByUserInputSchema)
  .handler(async ({ input }) => {
    const { userAddress, limit, offset } = input;

    if (!userAddress) {
      return {
        hasMore: false,
        totals: 0,
        trades: [],
      };
    }

    const response = await getTradesListByUserHandler({
      page_number: offset / limit + 1,
      page_size: limit,
      user_address: userAddress,
    });

    const items = response?.data?.trades.map((trade) => ({
      amountIn: trade.amount_in,
      createdAt: BigNumber(trade.created_at).div(1_000).toNumber(),
      displayAmountIn: BigNumber(trade.amount_in)
        .div(10 ** trade.token_x.decimals)
        .toFixed(2)
        .toString(),
      displayMinimalAmountOut: BigNumber(trade.minimal_amount_out)
        .div(10 ** trade.token_y.decimals)
        .toFixed(2)
        .toString(),
      minimalAmountOut: trade.minimal_amount_out,
      orderId: trade.order_id,
      signature: trade.signature,
      status: trade.status,
      tokenX: {
        address: trade.token_x.address,
        decimals: trade.token_x.decimals,
        imageUrl: trade.token_x.logo_uri,
        name: trade.token_x.name,
        symbol: trade.token_x.symbol,
      },
      tokenY: {
        address: trade.token_y.address,
        decimals: trade.token_y.decimals,
        imageUrl: trade.token_y.logo_uri,
        name: trade.token_y.name,
        symbol: trade.token_y.symbol,
      },
      tradeId: trade.trade_id,
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
