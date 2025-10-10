"use client";
import { tanstackClient } from "@dex-web/orpc";
import { Button, Icon } from "@dex-web/ui";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";
import { EMPTY_TOKEN } from "../_utils/constants";
import { selectedTokensParsers } from "../_utils/searchParams";
import { POPULAR_TOKEN_ADDRESSES } from "./_hooks/constants";
import { TokenImage } from "./TokenImage";

interface SelectTokenButtonProps {
  type: "buy" | "sell";
  returnUrl?: string;
}

/**
 * SelectTokenButton component for selecting tokens in swap/liquidity forms.
 *
 * Performance optimizations:
 * - Uses useQuery instead of useSuspenseQuery to prevent blocking parent rendering
 * - Implements hover/touch prefetch to warm cache before modal opens
 * - Prefetches popular tokens, pools, and route on user intent
 * - Shows loading state while token metadata loads
 * - Leverages server-side prefetching for initial page loads
 *
 * This avoids request waterfalls by prefetching modal dependencies ahead of time.
 */
export function SelectTokenButton({
  type,
  returnUrl = "",
}: SelectTokenButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const tokenAddress = type === "buy" ? tokenAAddress : tokenBAddress;

  const { tokenXAddress, tokenYAddress } = useMemo(
    () => sortSolanaAddresses(tokenAAddress, tokenBAddress),
    [tokenAAddress, tokenBAddress],
  );

  const queryInput = useMemo(
    () => ({
      $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
      filterBy: {
        case: "addressesList" as const,
        value: {
          $typeName: "darklake.v1.TokenAddressesList" as const,
          tokenAddresses: [tokenXAddress, tokenYAddress] as string[],
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
  });

  const tokenDetails = tokenMetadata?.tokens?.find(
    (token) => token.address === tokenAddress,
  );

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePrefetch = useCallback(() => {
    queryClient.prefetchQuery(
      tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
        context: { cache: "force-cache" as RequestCache },
        input: {
          $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
          filterBy: {
            case: "addressesList" as const,
            value: {
              $typeName: "darklake.v1.TokenAddressesList" as const,
              tokenAddresses: POPULAR_TOKEN_ADDRESSES as string[],
            },
          },
          pageNumber: 1,
          pageSize: POPULAR_TOKEN_ADDRESSES.length,
        },
      }),
    );

    queryClient.prefetchQuery(
      tanstackClient.pools.getAllPools.queryOptions({
        input: {
          includeEmpty: false,
        },
      }),
    );

    const href = buildHref(
      type,
      tokenAAddress,
      tokenBAddress,
      returnUrl,
      pathname,
      searchParams,
    );
    router.prefetch(href as any);
  }, [
    queryClient,
    type,
    tokenAAddress,
    tokenBAddress,
    returnUrl,
    router,
    pathname,
    searchParams,
  ]);

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
    return returnUrl ? `${returnUrl}/${basePath}` : `/${basePath}`;
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
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      prefetch
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
