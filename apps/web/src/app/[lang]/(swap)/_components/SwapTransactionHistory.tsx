"use client";

import type { SwapTransaction } from "@dex-web/core";
import { tanstackClient } from "@dex-web/orpc";
import { Box, Icon, Text } from "@dex-web/ui";
import {
  getDateDifference,
  getDateString,
  getExplorerUrl,
  getTimeString,
  getTimezoneString,
  groupTransactionByDate,
  numberFormatHelper,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

export function SwapTransactionHistory() {
  const { publicKey } = useWallet();
  const userAddress = publicKey?.toBase58();

  const limit = 20;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      ...tanstackClient.dexGateway.getTradesListByUser.infiniteOptions({
        getNextPageParam: (lastPage, allPages) => {
          if (!lastPage.hasMore) return undefined;
          return allPages.length * limit;
        },
        initialPageParam: 0,
        input: (pageParam: number) => ({
          limit,
          offset: pageParam,
          userAddress: userAddress || "",
        }),
      }),
      enabled: !!userAddress,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
      staleTime: 60 * 1000,
    });

  const trades = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.trades.filter((trade) => trade !== null),
      ) ?? []
    );
  }, [data]) as unknown as SwapTransaction[];

  const groupedTrades = useMemo(() => groupTransactionByDate(trades), [trades]);
  const timezone = `(${getTimezoneString()})`;

  if (!userAddress || isLoading) {
    return null;
  }

  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="mt-20 flex w-full gap-1">
      <div className="hidden size-9 md:block" />
      <Box className="flex w-full flex-col gap-6" padding="lg">
        <Text.Heading className="text-green-200">
          mev-protected trades
        </Text.Heading>
        <div className="scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-transparent max-h-100 overflow-y-auto">
          <InfiniteScroll
            dataLength={trades.length}
            endMessage={
              <div className="py-4 text-center">
                <Text.Body2 className="text-green-400">
                  Yay! You have seen it all
                </Text.Body2>
              </div>
            }
            hasMore={hasNextPage ?? false}
            loader={
              <div className="flex items-center justify-center gap-2 py-4 text-green-200">
                <Icon
                  className="size-4 animate-spin-pause text-inherit"
                  name="loading-stripe"
                />
                <Text.Body2 className="text-inherit">Loading...</Text.Body2>
              </div>
            }
            next={() => {
              if (!isFetchingNextPage && hasNextPage) {
                fetchNextPage();
              }
            }}
          >
            <div className="flex w-full flex-col gap-8">
              {groupedTrades.keys.map((key: string) => (
                <div className="flex flex-col gap-3" key={key}>
                  <Text.Body2 className="text-green-400">
                    {getDateDifference(key)}
                  </Text.Body2>
                  {groupedTrades.data[key]?.map((tx: SwapTransaction) => (
                    <div
                      className="flex flex-col border-green-400 border-b pb-3"
                      key={tx.tradeId}
                    >
                      <div className=" flex flex-row items-center gap-2">
                        <Text.Body2 className="text-green-200">SWAP</Text.Body2>
                        <Text
                          as={Link}
                          href={getExplorerUrl({ tx: tx.signature })}
                          target="_blank"
                        >
                          <Icon
                            className="size-4 cursor-pointer text-green-300"
                            name="external-link"
                          />
                        </Text>
                      </div>
                      <div className="flex flex-row justify-between">
                        <Text.Body2 className="text-green-300">
                          {`${numberFormatHelper({
                            decimalScale: tx.tokenIn.decimals,
                            trimTrailingZeros: true,
                            value: tx.displayAmountIn,
                          })} ${tx.tokenIn.symbol} FOR ${numberFormatHelper({
                            decimalScale: tx.tokenOut.decimals,
                            trimTrailingZeros: true,
                            value: tx.displayMinimalAmountOut,
                          })} ${tx.tokenOut.symbol}`}
                        </Text.Body2>
                        <Text.Body2 className="text-green-300">
                          {getDateString(tx.createdAt)}
                        </Text.Body2>
                      </div>
                      <div className="flex flex-row justify-between">
                        <Text.Body2 className="text-green-400">
                          {`1 ${tx.tokenIn.symbol} ≈ ${numberFormatHelper({
                            decimalScale: 2,
                            trimTrailingZeros: true,
                            value: tx.rate,
                          })} ${tx.tokenOut.symbol}`}
                        </Text.Body2>
                        <Text.Body2 className="text-green-300">
                          {getTimeString(tx.createdAt)} {timezone}
                        </Text.Body2>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </InfiniteScroll>
        </div>
      </Box>
      <div className="hidden size-9 md:block" />
    </div>
  );
}
