import { describe, expect, it, vi } from "vitest";

vi.mock("@dex-web/orpc", () => ({
  tanstackClient: {
    liquidity: {
      getUserLiquidity: {
        queryOptions: vi.fn(({ input }) => ({
          queryKey: [
            "liquidity",
            "getUserLiquidity",
            input.ownerAddress,
            input.tokenXMint,
            input.tokenYMint,
          ],
        })),
      },
    },
    pools: {
      getPoolDetails: {
        queryOptions: vi.fn(({ input }) => ({
          queryKey: [
            "pools",
            "getPoolDetails",
            input.tokenXMint,
            input.tokenYMint,
          ],
        })),
      },
      getPoolReserves: {
        queryOptions: vi.fn(({ input }) => ({
          queryKey: [
            "pools",
            "getPoolReserves",
            input.tokenXMint,
            input.tokenYMint,
          ],
        })),
      },
    },
  },
}));

import { invalidateLiquidityQueries } from "../invalidateLiquidityCache";

describe("invalidateLiquidityCache - Simple Test", () => {
  it("should work with a simple mock", async () => {
    const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);

    const queryClient = {
      invalidateQueries: mockInvalidateQueries,
    };

    await invalidateLiquidityQueries({
      queryClient,
      tokenXMint: "tokenX123",
      tokenYMint: "tokenY456",
      walletPublicKey: "wallet123",
    });

    expect(mockInvalidateQueries).toHaveBeenCalled();
  });
});
