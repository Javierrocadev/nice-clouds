import { expect, test } from "./toolcraft-product-test";
import { openClouds } from "./product-clouds-helpers";
test("browser: Nice Clouds opens with illustrated output and native controls", async ({ page }) => {
  await openClouds(page);
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expect(page.locator('[data-cloud-output] path')).toHaveCount(36);
  await expect(page.getByRole("button", { name: "Export PNG", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export MP4", exact: true })).toBeVisible();
});
