import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  expect(await page.locator("label").first().innerText()).toContain("SELLING");

  await expect(page.locator("body")).toMatchAriaSnapshot();
});
