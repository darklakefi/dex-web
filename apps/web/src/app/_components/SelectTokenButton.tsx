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
  returnUrl?: string;
}

export function SelectTokenButton({
  type,
  returnUrl = "",
}: SelectTokenButtonProps) {
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const tokenAddress = type === "buy" ? tokenAAddress : tokenBAddress;

  const validAddress =
    tokenAddress || (type === "buy" ? tokenAAddress : tokenBAddress);

  const { data: tokenDetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: validAddress || "" },
    }),
  );

  function buildHref(
    type: string,
    tokenA: string,
    tokenB: string,
    returnUrl?: string,
  ) {
    const basePath = `select-token/${type}?tokenAAddress=${tokenA}&tokenBAddress=${tokenB}`;
    return returnUrl ? `${returnUrl}/${basePath}` : `/${basePath}`;
  }
  return (
    <Button
      as={Link}
      className="mt-1 w-full items-center justify-between bg-green-700 p-2"
      href={buildHref(type, tokenAAddress, tokenBAddress, returnUrl)}
      prefetch={true}
      variant="secondary"
    >
      {tokenDetails.imageUrl ? (
        <Image
          alt={tokenDetails.symbol}
          className="size-8 overflow-hidden rounded-full"
          height={24}
          priority
          src={tokenDetails.imageUrl}
          unoptimized
          width={24}
        />
      ) : (
        <Icon name="seedlings" />
      )}
      <span className="flex items-center justify-center text-lg leading-6!">
        {tokenDetails.symbol}
      </span>
      <Icon className="size-4 fill-green-300" name="chevron-down" />
    </Button>
  );
}
