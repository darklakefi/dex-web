import type { SwapTransaction } from "@dex-web/core";
import { Box, Icon, Text } from "@dex-web/ui";
import { groupTransactionByDate } from "@dex-web/utils";

interface SwapTransactionHistoryProps {
  transactions: SwapTransaction[];
}

export function SwapTransactionHistory({
  transactions,
}: SwapTransactionHistoryProps) {
  const groupedTransactions = groupTransactionByDate(transactions);
  return (
    <Box className="flex flex-col gap-6" padding="lg">
      <Text.Heading>mev-protected trades</Text.Heading>
      <div className="flex w-full flex-col gap-8">
        {groupedTransactions.keys.map((key: string) => (
          <div className="flex flex-col gap-3" key={key}>
            <Text.Body2 className="text-green-400">{key}</Text.Body2>
            {groupedTransactions.data[key]?.map(
              (transaction: SwapTransaction) => (
                <div
                  className="flex flex-col border-green-400 border-b pb-3"
                  key={transaction.id}
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
                      {transaction.amountIn} {transaction.tokenIn.symbol} FOR{" "}
                      {transaction.amountOut} {transaction.tokenOut.symbol}
                    </Text.Body2>
                    <Text.Body2 className="text-green-300">
                      {transaction.executedAt.getDate()}{" "}
                      {transaction.executedAt.toLocaleString("default", {
                        month: "short",
                      })}
                      , {transaction.executedAt.getFullYear()}
                    </Text.Body2>
                  </div>
                  <div className="flex flex-row justify-between">
                    <Text.Body2 className="text-green-400">
                      1 {transaction.tokenIn.symbol} ≈{" "}
                      {transaction.amountOut / transaction.amountIn}{" "}
                      {transaction.tokenOut.symbol}
                    </Text.Body2>
                    <Text.Body2 className="text-green-300">
                      {transaction.executedAt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZoneName: "short",
                      })}
                    </Text.Body2>
                  </div>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </Box>
  );
}
