import type {
  GetTokenDetailsOutput,
  GetTokensOutput,
  Swap,
  TokenAccount,
} from "@dex-web/orpc/schemas";
import { vi } from "vitest";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";

export function mockOrpc() {
  vi.mock("@dex-web/orpc", () => ({
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
        queryOptions: vi.fn().mockImplementation(() => ({
          queryFn: () =>
            Promise.resolve({
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
          queryKey: ["getSwapDetails"],
        })),
      },
      getTokenDetails: {
        queryOptions: vi.fn().mockImplementation(() => ({
          queryFn: () =>
            Promise.resolve({
              address: DEFAULT_BUY_TOKEN,
              imageUrl: "https://example.com/image.png",
              name: "Solana",
              symbol: "SOL",
              value: "1000",
            } satisfies GetTokenDetailsOutput),
          queryKey: ["getTokenDetails"],
        })),
      },
      getTokens: {
        queryOptions: vi.fn().mockImplementation(() => ({
          queryFn: () =>
            Promise.resolve({
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
            } satisfies GetTokensOutput),
          queryKey: ["getTokens"],
        })),
      },
      helius: {
        getTokenAccounts: {
          queryOptions: vi.fn().mockImplementation(() => ({
            queryFn: () =>
              Promise.resolve({
                tokenAccounts: [
                  {
                    address: "0x123",
                    amount: 1000,
                    balance: 1000,
                    mint: "0x123",
                    symbol: "SOL",
                  } satisfies TokenAccount,
                ],
              }),
            queryKey: ["helius", "getTokenAccounts", { ownerAddress: "0x123" }],
          })),
        },
        searchAssets: {
          queryOptions: vi.fn().mockImplementation(() => ({
            queryFn: () =>
              Promise.resolve([
                {
                  description: "Solana",
                  id: "1",
                  image: { url: "https://example.com/image.png" },
                  name: "Solana",
                  symbol: "SOL",
                },
              ]),
            queryKey: ["helius", "searchAssets"],
          })),
        },
      },
    },
  }));

  vi.mock("../../../../../libs/orpc/src/routers/app.router.ts", () => ({
    appRouter: {
      getSwapDetails: vi.fn().mockResolvedValue({}),
    },
  }));
}
