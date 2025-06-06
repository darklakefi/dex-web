import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Expect p to contain a substring.
  expect(await page.locator("p").innerText()).toContain(
    "UNDER CONSTRUCTION 🚧",
  );
});
