import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { Text } from "../Text/Text";

export interface NoResultFoundProps {
  search: string;
  className?: string;
}

export function NoResultFound({ search, className }: NoResultFoundProps) {
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
      <div className="flex flex-col items-center justify-center gap-0.5">
        <Text.Body2 className="text-green-300">no results found for</Text.Body2>
        <Text.Body2 className="text-green-100 normal-case">{search}</Text.Body2>
      </div>
    </div>
  );
}
