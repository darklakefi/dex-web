import { client } from "@dex-web/orpc";
import { Button, Icon } from "@dex-web/ui";
import Image from "next/image";

interface SelectTokenButtonProps {
  symbol: string;
}

export async function SelectTokenButton({ symbol }: SelectTokenButtonProps) {
  const tokenDetails = await client.getTokenDetails({ symbol });

  return (
    <Button>
      {tokenDetails.imageUrl ? (
        <Image
          alt={symbol}
          height={24}
          src={tokenDetails.imageUrl}
          unoptimized
          width={24}
        />
      ) : (
        <Icon name="seedlings" />
      )}
      <span>{tokenDetails.symbol}</span>
      <span>{tokenDetails.value}</span>
    </Button>
  );
}
