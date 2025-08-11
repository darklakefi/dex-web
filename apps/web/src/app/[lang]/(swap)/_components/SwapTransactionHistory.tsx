"use client";

import type { SwapTransaction } from "@dex-web/core";
import { client, tanstackClient } from "@dex-web/orpc";
import { Box, Icon, Text } from "@dex-web/ui";
import {
  getDateDifference,
  getDateString,
  getTimeString,
  getTimezoneString,
  groupTransactionByDate,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

export function SwapTransactionHistory() {
  const { publicKey } = useWallet();

  const limit = 20;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [trades, setTrades] = useState<SwapTransaction[]>([]);

  const fetchTransactions = async () => {
    if (!publicKey) return;

    const response = await client.dexGateway.getTradesListByUser({
      limit,
      offset,
      user_address: publicKey.toBase58(),
    });

    setHasMore(response.hasMore);
    setTrades([...trades, ...response.trades]);

    if (response.hasMore) {
      setOffset(offset + limit);
    }
  };
  const groupedTrades = groupTransactionByDate(trades);
  const timezone = `(${getTimezoneString()})`;

  const { data } = useSuspenseQuery(
    tanstackClient.dexGateway.getTradesListByUser.queryOptions({
      input: {
        limit: 1,
        offset: 0,
        user_address: publicKey?.toBase58() ?? "",
      },
    }),
  );

  return data?.trades.length > 0 ? (
    <Box className="flex w-full flex-col gap-6" padding="lg">
      <Text.Heading className="text-green-200">
        mev-protected trades
      </Text.Heading>
      <div className="max-h-100 overflow-y-auto">
        <InfiniteScroll
          dataLength={trades.length}
          endMessage={
            <div className="py-4 text-center">
              <Text.Body2 className="text-green-400">
                Yay! You have seen it all
              </Text.Body2>
            </div>
          }
          hasMore={hasMore}
          loader={
            <div className="flex items-center justify-center gap-2 py-4 text-green-200">
              <Icon
                className="size-4 animate-spin-pause text-inherit"
                name="loading-stripe"
              />
              <Text.Body2 className="text-inherit">Loading...</Text.Body2>
            </div>
          }
          next={fetchTransactions}
        >
          <div className="flex w-full flex-col gap-8">
            {groupedTrades.keys.map((key: string) => (
              <div className="flex flex-col gap-3" key={key}>
                <Text.Body2 className="text-green-400">
                  {getDateDifference(key)}
                </Text.Body2>
                {groupedTrades.data[key]?.map(
                  (transaction: SwapTransaction) => (
                    <div
                      className="flex flex-col border-green-400 border-b pb-3"
                      key={transaction.tradeId}
                    >
                      <div className=" flex flex-row items-center gap-2">
                        <Text.Body2 className="text-green-200">SWAP</Text.Body2>
                        <Icon
                          className="size-4 cursor-pointer text-green-300"
                          name="external-link"
                        />
                      </div>
                      <div className="flex flex-row justify-between">
                        <Text.Body2 className="text-green-300">
                          {`${transaction.displayAmountIn} TOKI FOR ${transaction.displayMinimalAmountOut} TOKO`}
                        </Text.Body2>
                        <Text.Body2 className="text-green-300">
                          {getDateString(transaction.createdAt)}
                        </Text.Body2>
                      </div>
                      <div className="flex flex-row justify-between">
                        <Text.Body2 className="text-green-400">
                          {`1 TOKI ≈ ${transaction.minimalAmountOut / transaction.amountIn} TOKO`}
                        </Text.Body2>
                        <Text.Body2 className="text-green-300">
                          {getTimeString(transaction.createdAt)} {timezone}
                        </Text.Body2>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </Box>
  ) : null;
}
