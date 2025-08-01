import { expect, test } from "@playwright/test";
import { setupMockOrpcHandlers } from "../helpers/setupMockOrpcHandlers";

test.describe("Swap Page", () => {
  test.skip("should refresh swap details when refresh button is clicked", async ({
    page,
  }) => {
    await setupMockOrpcHandlers(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "swap" })).toBeVisible();
    await expect(page.getByText("ANTI-SANDWICH DEFENSE:")).toBeVisible();
    await expect(page.getByText("Value preservation system")).toBeVisible();
    await expect(page.getByRole("img", { name: "Waddles" })).toBeVisible();
    const swapDetailsLocator = page.locator("_react=SwapDetails");
    await expect(swapDetailsLocator).toBeVisible();
    const initialContent = await swapDetailsLocator.textContent();
    await expect(page.getByRole("button", { name: "refresh" })).toBeVisible();
    await page.getByRole("button", { name: "refresh" }).click();

    await expect(async () => {
      const updatedContent = await swapDetailsLocator.textContent();
      expect(updatedContent).not.toEqual(initialContent);
    }).toPass();

    await expect(page.getByRole("button", { name: "refresh" })).toBeVisible();
  });
});
