"use client";
import { tanstackClient, tokenQueryKeys } from "@dex-web/orpc";
import { Button, Icon } from "@dex-web/ui";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryStates } from "nuqs";
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

  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    tokenAAddress,
    tokenBAddress,
  );

  const { data: tokenMetadata } = useSuspenseQuery({
    ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
      input: {
        $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
        filterBy: {
          case: "addressesList" as const,
          value: {
            $typeName: "darklake.v1.TokenAddressesList" as const,
            tokenAddresses: [tokenXAddress, tokenYAddress],
          },
        },
        pageNumber: 1,
        pageSize: 2,
      },
    }),
    queryKey: tokenQueryKeys.metadata.byAddresses([
      tokenXAddress,
      tokenYAddress,
    ]),
  });

  const tokenDetails = tokenMetadata.tokens.find(
    (token) => token.address === tokenAddress,
  );

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(
    type: string,
    tokenA: string,
    tokenB: string,
    returnUrl?: string,
  ) {
    const additionalParamsString = "";
    const from = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    const basePath = `select-token/${type}?tokenAAddress=${tokenA}&tokenBAddress=${tokenB}&from=${encodeURIComponent(
      from,
    )}${additionalParamsString ? `&${additionalParamsString}` : ""}`;
    return returnUrl ? `${returnUrl}/${basePath}` : `/${basePath}`;
  }

  return (
    <Button
      as={Link}
      className="mt-1 w-fit items-center justify-between bg-green-700 p-2"
      href={buildHref(type, tokenAAddress, tokenBAddress, returnUrl)}
      prefetch
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
