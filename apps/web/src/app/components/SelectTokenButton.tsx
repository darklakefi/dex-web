import { Button } from "@dex-web/ui";
import Image from "next/image";

interface SelectTokenButtonProps {
  symbol: string;
  value: string;
  imageUrl: string;
}
export function SelectTokenButton({
  symbol,
  value,
  imageUrl,
}: SelectTokenButtonProps) {
  return (
    <Button>
      <Image alt={symbol} src={imageUrl} />
      <span>{symbol}</span>
      <span>{value}</span>
    </Button>
  );
}
