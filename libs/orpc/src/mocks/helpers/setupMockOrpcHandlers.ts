"use server";

import { generateMockSwap } from "./generateMockSwap";

export async function setupMockOrpcHandlers(
  page: import("@playwright/test").Page,
) {
  await page.route("**/rpc", async (route, request) => {
    const body = JSON.parse(request.postData() || "{}");

    if (body.method === "getSwapDetails") {
      const mockSwap = generateMockSwap(new Date().toISOString());

      await route.fulfill({
        body: JSON.stringify({ result: mockSwap }),
        contentType: "application/json",
        status: 200,
      });
    } else if (body.method === "getTokenDetails") {
      await route.fulfill({
        body: JSON.stringify({
          result: {
            address: "fake-address",
            imageUrl: "https://example.com/fake-token.png",
            name: "Fake Token",
            symbol: "FAKE",
            value: "1000",
          },
        }),
        contentType: "application/json",
        status: 200,
      });
    } else if (body.method === "getTokens") {
      await route.fulfill({
        body: JSON.stringify({
          result: {
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
          },
        }),
        contentType: "application/json",
        status: 200,
      });
    } else if (body.method === "helius.searchAssets") {
      await route.fulfill({
        body: JSON.stringify({
          result: [
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
          ],
        }),
        contentType: "application/json",
        status: 200,
      });
    } else if (body.method === "helius.getTokenBalance") {
      await route.fulfill({
        body: JSON.stringify({
          result: {
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
          },
        }),
        contentType: "application/json",
        status: 200,
      });
    } else {
      route.continue();
    }
  });
}
