import { Text } from "@dex-web/ui";
import { twMerge } from "tailwind-merge";

export interface SlippageCustomOptionProps {
  selected: boolean;
  onClick: (slippage: string) => void;
  onChange: (slippage: string) => void;
  slippage: string;
}

export function SlippageCustomOption({
  selected,
  onClick,
  onChange,
  slippage,
}: SlippageCustomOptionProps) {
  return (
    <button
      aria-label="custom-slippage"
      className={twMerge(
        "flex cursor-pointer items-center gap-2",
        selected ? "text-green-200" : "text-green-300",
      )}
      onClick={() => {
        onClick(slippage);
      }}
      type="button"
    >
      <Text.Body2 className="text-inherit">
        {selected ? "[x]" : "[ ]"}
      </Text.Body2>
      <div className="flex items-center gap-1 border border-green-400 bg-green-600 pr-1">
        <input
          aria-label="slippage"
          className="w-10 text-end font-sans text-inherit text-md uppercase focus:outline-none"
          inputMode="decimal"
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, "");
            const sanitized = value.split(".").slice(0, 2).join(".");
            onChange(sanitized);
          }}
          type="text"
          value={slippage === "0" ? "" : slippage}
        />
        %
      </div>
    </button>
  );
}
