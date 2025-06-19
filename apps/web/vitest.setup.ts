import { appRouter } from "@dex-web/orpc";
import { implement, unlazyRouter } from "@orpc/server";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

(async () => {
  const unlazy = await unlazyRouter(appRouter);

  implement(unlazy.getTokenDetails).handler(async () => ({
    address: "fake-address",
    imageUrl: "https://example.com/fake-token.png",
    name: "Fake Token",
    symbol: "FAKE",
    value: "1000",
  }));

  implement(unlazy.getTokens).handler(async () => ({
    hasMore: false,
    tokens: [
      {
        address: "fake-address-1",
        imageUrl: "https://example.com/fake-token1.png",
        name: "Fake Token 1",
        symbol: "FAKE1",
        value: "1000",
      },
      {
        address: "fake-address-2",
        imageUrl: "https://example.com/fake-token2.png",
        name: "Fake Token 2",
        symbol: "FAKE2",
        value: "2000",
      },
    ],
    total: 2,
  }));

  implement(unlazy.helius.getTokenBalance).handler(async () => ({
    assets: [
      {
        description: "Fake asset description",
        id: "asset-1",
        image: { url: "https://example.com/asset1.png" },
        name: "Fake Asset 1",
        symbol: "FAKE1",
      },
    ],
    ownerAddress: "fake-owner-address",
    tokenAccounts: [
      {
        address: "account-1",
        amount: 1000,
        mint: "mint-1",
      },
    ],
    total: 1,
  }));

  implement(unlazy.helius.searchAssets).handler(async () => [
    {
      description: "Fake asset description",
      id: "asset-1",
      image: { url: "https://example.com/asset1.png" },
      name: "Fake Asset 1",
      symbol: "FAKE1",
    },
    {
      description: "Fake asset description 2",
      id: "asset-2",
      image: { url: "https://example.com/asset2.png" },
      name: "Fake Asset 2",
      symbol: "FAKE2",
    },
  ]);
})();

afterEach(() => {
  cleanup();
});
