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

    const items = response?.data?.trades.map((trade) => {
      const tokenIn = trade.is_swap_x_to_y ? trade.token_x : trade.token_y;
      const tokenOut = trade.is_swap_x_to_y ? trade.token_y : trade.token_x;
      const displayAmountIn = BigNumber(trade.amount_in).div(
        10 ** tokenIn.decimals,
      );
      const displayMinimalAmountOut = BigNumber(trade.minimal_amount_out).div(
        10 ** tokenOut.decimals,
      );

      return {
        amountIn: trade.amount_in,
        createdAt: BigNumber(trade.created_at).div(1_000).toNumber(),
        displayAmountIn: displayAmountIn.toFixed(2).toString(),
        displayMinimalAmountOut: displayMinimalAmountOut.toFixed(2).toString(),
        isSwapXToY: trade.is_swap_x_to_y,
        minimalAmountOut: trade.minimal_amount_out,
        orderId: trade.order_id,
        rate: displayAmountIn
          .div(displayMinimalAmountOut.isZero() ? 1 : displayMinimalAmountOut)
          .toString(),
        signature: trade.signature,
        status: trade.status,
        tokenIn: {
          address: tokenIn.address,
          decimals: tokenIn.decimals,
          imageUrl: tokenIn.logo_uri,
          name: tokenIn.name,
          symbol: tokenIn.symbol,
        },
        tokenOut: {
          address: tokenOut.address,
          decimals: tokenOut.decimals,
          imageUrl: tokenOut.logo_uri,
          name: tokenOut.name,
          symbol: tokenOut.symbol,
        },
        tradeId: trade.trade_id,
        userAddress: trade.user_address,
      };
    });

    return {
      hasMore:
        (response?.data?.total_pages ?? 0) >
        (response?.data?.current_page ?? 0),
      totals: (response?.data?.total_pages ?? 0) * limit,
      trades: items ?? [],
    };
  });
