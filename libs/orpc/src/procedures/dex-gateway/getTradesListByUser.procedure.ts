import type { Trade } from "@dex-web/grpc-client";
import BigNumber from "bignumber.js";
import { z } from "zod";
import { getTradesListByUserHandler } from "../../handlers/dex-gateway/getTradesListByUser.handler";
import { baseProcedure } from "../base.procedure";

const getTradesListByUserInputSchema = z.object({
  limit: z.number().default(10),
  offset: z.number().default(0),
  userAddress: z.string(),
});

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
      pageNumber: offset / limit + 1,
      pageSize: limit,
      userAddress: userAddress,
      $typeName: "darklake.v1.GetTradesListByUserRequest",
    });

    const items = response?.data?.trades.map((trade: Trade) => {
      const tokenIn = trade.isSwapXToY ? trade.tokenX : trade.tokenY;
      const tokenOut = trade.isSwapXToY ? trade.tokenY : trade.tokenX;

      if (!tokenIn || !tokenOut) {
        return null;
      }

      const displayAmountIn = BigNumber(trade.amountIn).div(
        10 ** tokenIn.decimals
      );
      const displayMinimalAmountOut = BigNumber(trade.minimalAmountOut).div(
        10 ** tokenOut.decimals
      );

      return {
        amountIn: trade.amountIn,
        createdAt: BigNumber(trade.createdAt).div(1_000).toNumber(),
        displayAmountIn: displayAmountIn.toFixed(2).toString(),
        displayMinimalAmountOut: displayMinimalAmountOut.toFixed(2).toString(),
        isSwapXToY: trade.isSwapXToY,
        minimalAmountOut: trade.minimalAmountOut,
        orderId: trade.orderId,
        rate: displayMinimalAmountOut.div(displayAmountIn).toString(),
        signature: trade.signature,
        status: trade.status,
        tokenIn: {
          address: tokenIn.address,
          decimals: tokenIn.decimals,
          imageUrl: tokenIn.logoUri,
          name: tokenIn.name,
          symbol: tokenIn.symbol,
        },
        tokenOut: {
          address: tokenOut.address,
          decimals: tokenOut.decimals,
          imageUrl: tokenOut.logoUri,
          name: tokenOut.name,
          symbol: tokenOut.symbol,
        },
        tradeId: trade.tradeId,
        userAddress: trade.userAddress,
      };
    });

    return {
      hasMore:
        (response?.data?.totalPages ?? 0) > (response?.data?.currentPage ?? 0),
      totals: (response?.data?.totalPages ?? 0) * limit,
      trades: items?.filter(Boolean) ?? [],
    };
  });
