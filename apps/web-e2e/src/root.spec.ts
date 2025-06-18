import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect the first paragraph to contain a substring.
  expect(await page.locator("label").first().innerText()).toContain("SELLING");

  await expect(page).toHaveScreenshot();
});
