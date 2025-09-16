"use client";
import { tanstackClient } from "@dex-web/orpc";
import type { Token } from "@dex-web/orpc/schemas";
import { Button, Icon } from "@dex-web/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryStates } from "nuqs";
import { EMPTY_TOKEN } from "../_utils/constants";
import { selectedTokensParsers } from "../_utils/searchParams";

interface SelectTokenButtonProps {
  type: "buy" | "sell";
  returnUrl?: string;
  additionalParams?: Record<string, string>;
}

export function SelectTokenButton({
  type,
  returnUrl = "",
  additionalParams = {},
}: SelectTokenButtonProps) {
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const tokenAddress = type === "buy" ? tokenAAddress : tokenBAddress;

  const { data: tokenMetadata } = useSuspenseQuery(
    tanstackClient.tokens.getTokenMetadata.queryOptions({
      input: { addresses: [tokenAddress || ""], returnAsObject: true },
    }),
  );

  const metadata = tokenMetadata as Record<string, Token>;
  const tokenDetails = metadata[tokenAddress]!;

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(
    type: string,
    tokenA: string,
    tokenB: string,
    returnUrl?: string,
  ) {
    const additionalParamsString = "";
    // Object.entries(additionalParams)
    //   .map(([key, value]) => `${key}=${value}`)
    //   .join("&");
    const from = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    // console.log("From:", from);
    const basePath = `select-token/${type}?tokenAAddress=${tokenA}&tokenBAddress=${tokenB}&from=${encodeURIComponent(
      from,
    )}${additionalParamsString ? `&${additionalParamsString}` : ""}`;
    // console.log("Base path:", basePath);
    // console.log("Return url:", returnUrl);
    return returnUrl ? `${returnUrl}/${basePath}` : `/${basePath}`;
  }

  return (
    <Button
      as={Link}
      className="mt-1 w-fit items-center justify-between bg-green-700 p-2"
      href={buildHref(type, tokenAAddress, tokenBAddress, returnUrl)}
      prefetch={true}
      variant="secondary"
    >
      {tokenAAddress === EMPTY_TOKEN ? (
        <Image
          alt="token-placeholder"
          className="size-8 overflow-hidden rounded-full"
          height={24}
          priority
          src={"/images/token-placeholder.png"}
          width={24}
        />
      ) : tokenDetails?.imageUrl ? (
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
      {tokenDetails?.symbol && (
        <span className="flex items-center justify-center text-lg leading-6!">
          {tokenDetails.symbol}
        </span>
      )}
      <Icon className="size-4 fill-green-300" name="chevron-down" />
    </Button>
  );
}
