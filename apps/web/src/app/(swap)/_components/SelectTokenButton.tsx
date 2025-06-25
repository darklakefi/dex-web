"use client";
import { tanstackClient } from "@dex-web/orpc";
import { Button, Icon } from "@dex-web/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import { selectedTokensParsers } from "../_utils/searchParams";

interface SelectTokenButtonProps {
  type: "buy" | "sell";
}

export function SelectTokenButton({ type }: SelectTokenButtonProps) {
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const tokenAddress = type === "buy" ? buyTokenAddress : sellTokenAddress;
  const { data: tokenDetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: tokenAddress },
    }),
  );

  return (
    <Button
      as={Link}
      className="w-full justify-between bg-green-700 p-1"
      href={`/select-token/${type}/?buyTokenAddress=${buyTokenAddress}&sellTokenAddress=${sellTokenAddress}`}
      prefetch
      variant="secondary"
    >
      {tokenDetails.imageUrl ? (
        <Image
          alt={tokenDetails.symbol}
          className="size-6 overflow-hidden rounded-full"
          height={24}
          priority
          src={tokenDetails.imageUrl}
          unoptimized
          width={24}
        />
      ) : (
        <Icon name="seedlings" />
      )}
      <span className="flex items-center justify-center leading-none">
        {tokenDetails.symbol}
      </span>
      <Icon className="size-4 fill-green-300" name="chevron-down" />
    </Button>
  );
}
