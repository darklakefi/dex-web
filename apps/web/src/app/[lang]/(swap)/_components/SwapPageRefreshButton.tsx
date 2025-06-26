"use client";

import { tanstackClient } from "@dex-web/orpc";
import { Icon } from "@dex-web/ui";
import { useQueryClient } from "@tanstack/react-query";
import { MOCK_OWNER_ADDRESS, MOCK_SWAP_ID } from "../_utils/constants";

export function SwapPageRefreshButton() {
  const queryClient = useQueryClient();

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: tanstackClient.getSwapDetails.key({
          input: { swapId: MOCK_SWAP_ID },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.getTokenDetails.key({
          input: { address: MOCK_OWNER_ADDRESS },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.helius.getTokenBalance.key({
          input: { ownerAddress: MOCK_OWNER_ADDRESS },
        }),
      }),
    ]);
  }

  return (
    <button
      aria-label="refresh"
      className="inline-flex items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
      onClick={handleClick}
      type="button"
    >
      <Icon className="size-5" name="refresh" />
    </button>
  );
}
