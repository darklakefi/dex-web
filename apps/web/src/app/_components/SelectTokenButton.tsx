"use client";
import { tanstackClient } from "@dex-web/orpc";
import { Button, Icon } from "@dex-web/ui";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { EMPTY_TOKEN } from "../_utils/constants";
import { selectedTokensParsers } from "../_utils/searchParams";
import { TokenImage } from "./TokenImage";

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

  const { tokenXAddress, tokenYAddress } = useMemo(() => {
    if (!tokenAAddress || !tokenBAddress) {
      return {
        tokenXAddress: tokenAAddress || "",
        tokenYAddress: tokenBAddress || "",
      };
    }
    return sortSolanaAddresses(tokenAAddress, tokenBAddress);
  }, [tokenAAddress, tokenBAddress]);

  const queryInput = useMemo(
    () => ({
      $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
      filterBy: {
        case: "addressesList" as const,
        value: {
          $typeName: "darklake.v1.TokenAddressesList" as const,
          tokenAddresses: [tokenXAddress, tokenYAddress].filter(
            Boolean,
          ) as string[],
        },
      },
      pageNumber: 1,
      pageSize: 2,
    }),
    [tokenXAddress, tokenYAddress],
  );

  const { data: tokenMetadata, isLoading } = useQuery({
    ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: queryInput,
    }),
    enabled: Boolean(tokenXAddress || tokenYAddress),
  });

  const tokenDetails = tokenMetadata?.tokens?.find(
    (token) => token.address === tokenAddress,
  );

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(
    type: string,
    tokenA: string,
    tokenB: string,
    returnUrl: string | undefined,
    currentPathname: string,
    currentSearchParams: URLSearchParams | null,
  ) {
    const additionalParamsString = "";

    const existingFrom = currentSearchParams?.get("from");

    let from: string;
    if (existingFrom) {
      from = existingFrom;
    } else {
      const cleanPathname = currentPathname.replace(
        /\/select-token\/[^/]+/g,
        "",
      );
      const queryString = currentSearchParams?.toString();
      const paramsWithoutFrom = new URLSearchParams(queryString || "");
      paramsWithoutFrom.delete("from");
      const cleanQueryString = paramsWithoutFrom.toString();
      from = `${cleanPathname}${cleanQueryString ? `?${cleanQueryString}` : ""}`;
    }

    const basePath = `select-token/${type}?tokenAAddress=${tokenA}&tokenBAddress=${tokenB}&from=${encodeURIComponent(
      from,
    )}${additionalParamsString ? `&${additionalParamsString}` : ""}`;
    return returnUrl ? `/${returnUrl}/${basePath}` : `/${basePath}`;
  }

  return (
    <Button
      as={Link}
      className="mt-1 w-fit items-center justify-between bg-green-700 p-2"
      href={buildHref(
        type,
        tokenAAddress,
        tokenBAddress,
        returnUrl,
        pathname,
        searchParams,
      )}
      variant="secondary"
    >
      {isLoading ? (
        <div className="size-8 animate-pulse rounded-full bg-green-600/40" />
      ) : tokenAAddress === EMPTY_TOKEN ? (
        <Image
          alt="token-placeholder"
          className="size-8 overflow-hidden rounded-full"
          height={24}
          priority
          src={"/images/token-placeholder.png"}
          width={24}
        />
      ) : tokenDetails ? (
        <TokenImage
          address={tokenDetails.address}
          imageUrl={tokenDetails.logoUri}
          priority
          size={32}
          symbol={tokenDetails.symbol}
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
