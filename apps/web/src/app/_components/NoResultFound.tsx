import { isValidSolanaAddress, truncate } from "@dex-web/utils";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { Button } from "../../../../../libs/ui/src/lib/Button/Button";
import { Text } from "../../../../../libs/ui/src/lib/Text/Text";

export interface NoResultFoundProps {
  search: string;
  className?: string;
  allowUnknownTokens?: boolean;
  handleSelect: (
    selectedTokenAddress: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => void;
}

export function NoResultFound({
  search,
  className,
  handleSelect,
  allowUnknownTokens = false,
}: NoResultFoundProps) {
  return (
    <div
      className={twMerge(
        "flex flex-col items-center justify-center gap-2",
        className,
      )}
    >
      <Image
        alt="No token found"
        height={60}
        src="/images/magnify.png"
        width={48}
      />
      <div className="mb-4 flex flex-col items-center justify-center gap-0.5">
        <Text.Body2 className="text-green-300">no results found for</Text.Body2>
        <Text.Body2 className="mb-4 text-green-100 normal-case">
          {truncate(search, 10, 10)}
        </Text.Body2>
      </div>

      {isValidSolanaAddress(search) && allowUnknownTokens ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <Text.Body2 className="max-w-60 text-green-300 text-xs">
            Valid Solana address detected
          </Text.Body2>
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
              handleSelect(search, e)
            }
            variant="secondary"
          >
            Select Token Manually
          </Button>
        </div>
      ) : null}
    </div>
  );
}
