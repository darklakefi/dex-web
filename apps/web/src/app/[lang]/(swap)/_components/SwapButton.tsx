"use client";

import { Icon } from "@dex-web/ui";
import { useQueryStates } from "nuqs";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../_utils/constants";
import { selectedTokensParsers } from "../_utils/searchParams";

export function SwapButton() {
  const [{ buyTokenAddress, sellTokenAddress }, setSelectedTokens] =
    useQueryStates(selectedTokensParsers);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    setSelectedTokens({
      buyTokenAddress: sellTokenAddress ?? DEFAULT_BUY_TOKEN,
      sellTokenAddress: buyTokenAddress ?? DEFAULT_SELL_TOKEN,
    });
  }

  return (
    <button
      className="inline-flex cursor-pointer items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300 hover:border-green-500 hover:text-green-200 focus:border-green-400 focus:text-green-200"
      onClick={handleClick}
      type="button"
    >
      <Icon className="size-6" name="swap" />
    </button>
  );
}
