import { client } from "@dex-web/orpc";
import { Button, Icon } from "@dex-web/ui";
import Image from "next/image";
import Link from "next/link";
import { selectedTokensCache } from "./searchParams";

interface SelectTokenButtonProps {
  type: "buy" | "sell";
}

export async function SelectTokenButton({ type }: SelectTokenButtonProps) {
  const { buyTokenAddress, sellTokenAddress } = selectedTokensCache.all();

  const tokenAddress = type === "buy" ? buyTokenAddress : sellTokenAddress;
  const tokenDetails = await client.getTokenDetails({ address: tokenAddress });

  return (
    <Button
      as={Link}
      className="w-full justify-between bg-green-700 p-1"
      href={`/select-token/${type}/?buyTokenAddress=${buyTokenAddress}&sellTokenAddress=${sellTokenAddress}`}
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
