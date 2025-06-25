import type {
  GetTokenBalanceOutput,
  GetTokenDetailsOutput,
  GetTokensOutput,
  SearchAssetsOutput,
  Swap,
} from "@dex-web/orpc/schemas";
import { vi } from "vitest";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";

export function mockOrpc() {
  vi.doMock("@dex-web/orpc", () => ({
    client: {
      getSwapDetails: vi.fn().mockResolvedValue({
        buyAmount: 100,
        buyBalance: 100,
        buyToken: {
          address: DEFAULT_BUY_TOKEN,
          symbol: "SOL",
          value: "1000",
        },
        estimatedFeesUsd: 100,
        exchangeRate: 0.00669,
        mevProtectionEnabled: true,
        priceImpactPercentage: 12,
        sellAmount: 100,
        sellBalance: 100,
        sellToken: {
          address: DEFAULT_SELL_TOKEN,
          symbol: "USDC",
          value: "1000",
        },
        slippageTolerancePercentage: 12,
        swapProgressStep: 1,
        swapStatus: "pending",
        swapType: "swap",
        updatedAt: new Date().toISOString(),
        userAddress: "0x123",
      } satisfies Swap),
      getTokenDetails: vi.fn().mockResolvedValue({
        address: DEFAULT_BUY_TOKEN,
        imageUrl: "https://example.com/image.png",
        name: "Solana",
        symbol: "SOL",
        value: "1000",
      } satisfies GetTokenDetailsOutput),
    },
    tanstackClient: {
      getSwapDetails: {
        queryOptions: vi.fn().mockReturnValue({
          data: {
            buyAmount: 100,
            buyBalance: 100,
            buyToken: {
              address: DEFAULT_BUY_TOKEN,
              symbol: "SOL",
              value: "1000",
            },
            estimatedFeesUsd: 100,
            exchangeRate: 0.00669,
            mevProtectionEnabled: true,
            priceImpactPercentage: 12,
            sellAmount: 100,
            sellBalance: 100,
            sellToken: {
              address: DEFAULT_SELL_TOKEN,
              symbol: "USDC",
              value: "1000",
            },
            slippageTolerancePercentage: 12,
            swapProgressStep: 1,
            swapStatus: "pending",
            swapType: "swap",
            updatedAt: new Date().toISOString(),
            userAddress: "0x123",
          } satisfies Swap,
        }),
      },
      getTokenDetails: {
        queryOptions: vi.fn().mockReturnValue({
          data: {
            address: DEFAULT_BUY_TOKEN,
            imageUrl: "https://example.com/image.png",
            name: "Solana",
            symbol: "SOL",
            value: "1000",
          } satisfies GetTokenDetailsOutput,
        }),
      },
      getTokens: {
        queryOptions: vi.fn().mockReturnValue({
          data: {
            hasMore: false,
            tokens: [
              {
                address: DEFAULT_BUY_TOKEN,
                imageUrl: "https://example.com/image.png",
                name: "Solana",
                symbol: "SOL",
                value: "1000",
              },
            ],
            total: 0,
          } satisfies GetTokensOutput,
        }),
      },
      helius: {
        getTokenBalance: {
          queryOptions: vi.fn().mockReturnValue({
            data: {
              assets: [],
              ownerAddress: "0x123",
              tokenAccounts: [],
              total: 0,
            } satisfies GetTokenBalanceOutput,
          }),
        },
        searchAssets: {
          queryOptions: vi.fn().mockReturnValue({
            data: [
              {
                description: "Solana",
                id: "1",
                image: { url: "https://example.com/image.png" },
                name: "Solana",
                symbol: "SOL",
              },
            ] satisfies SearchAssetsOutput,
          }),
        },
      },
    },
  }));
}
