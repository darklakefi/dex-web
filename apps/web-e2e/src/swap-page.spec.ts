import { expect, test } from "@playwright/test";
import { getMockSwapDetails } from "./mocks/mockHandlers";

test.describe("Swap Page", () => {
  test("should refresh swap details when refresh button is clicked", async ({
    page,
  }) => {
    let requestCount = 0;
    await page.route("**/rpc/getSwapDetails", (route) => {
      requestCount += 1;
      const mockData =
        requestCount === 1
          ? getMockSwapDetails()
          : getMockSwapDetails({ buyAmount: 9999, exchangeRate: 9.999 });

      return route.fulfill({
        json: {
          result: {
            data: {
              json: mockData,
            },
          },
        },
      });
    });

    await page.goto("/");

    await expect(page.getByText("1.337")).toBeVisible();

    await page.getByRole("button", { name: "refresh" }).click();

    await expect(page.getByText("9.999")).toBeVisible();
  });
});
