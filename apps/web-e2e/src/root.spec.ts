import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect the first paragraph to contain a substring.
  expect(await page.locator("p").first().innerText()).toContain(
    "UNDER CONSTRUCTION 🚧",
  );
});
