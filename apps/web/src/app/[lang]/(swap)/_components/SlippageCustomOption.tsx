import { Text } from "@dex-web/ui";
import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { type Slippage, slippageIsWithinRange } from "./SwapPageSettingButton";

export interface SlippageCustomOptionProps {
  onClick: (slippage: Slippage) => void;
  onChange: (slippage: Slippage) => void;
  slippage: Slippage;
}

export function SlippageCustomOption({
  onClick,
  onChange,
  slippage,
}: SlippageCustomOptionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [localValue, setLocalValue] = useState<string | null>(null);

  return (
    <button
      aria-label="custom-slippage"
      className={twMerge(
        "flex cursor-pointer items-center gap-2",
        slippage.type === "custom" ? "text-green-200" : "text-green-300",
      )}
      onClick={() => {
        onClick({
          type: "custom",
          value: localValue ?? "",
        });
      }}
      type="button"
    >
      <Text.Body2 className="text-inherit">
        {slippage.type === "custom" ? "[x]" : "[ ]"}
      </Text.Body2>
      <div className="flex items-center gap-1 border border-green-400 bg-green-600 pr-1">
        <input
          aria-label="slippage"
          className="w-10 text-end font-sans text-inherit text-md uppercase focus:outline-none"
          inputMode="decimal"
          onChange={(e) => {
            onChange({
              type: "custom",
              value: String(Number(e.target.value)),
            });
            if (slippageIsWithinRange(String(Number(e.target.value)))) {
              setLocalValue(String(Number(e.target.value)));
            }
          }}
          ref={inputRef}
          type="number"
          value={localValue ?? ""}
        />
        %
      </div>
    </button>
  );
}
