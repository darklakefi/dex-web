import { Text } from "@dex-web/ui";
import { twMerge } from "tailwind-merge";

export interface SlippageDefaultOptionProps {
  slippage: number;
  selected: boolean;
  onClick: () => void;
}

export function SlippageDefaultOption({
  slippage,
  selected,
  onClick,
}: SlippageDefaultOptionProps) {
  return (
    <button
      aria-label={`${slippage}%`}
      className={twMerge(
        "flex cursor-pointer gap-1",
        selected ? "text-green-200" : "text-green-300",
      )}
      onClick={() => {
        onClick();
      }}
      type="button"
    >
      <Text.Body2 className="text-inherit">
        {selected ? "[x]" : "[ ]"}
      </Text.Body2>
      <Text.Body2 className="text-inherit">{slippage}%</Text.Body2>
    </button>
  );
}
