import { test, expect } from "@playwright/test";

test("crear producto y visualizarlo", async ({ page }) => {
  await page.goto("/");

  const productName = "Producto E2E " + Date.now();

  await page.locator("input").nth(0).fill(productName);
  await page.locator("input").nth(2).fill("5");

  await page.getByRole("button", { name: "Crear producto" }).click();

  // 👇 SOLO el título del producto (no el select)
  await expect(
    page.locator("h3", { hasText: productName })
  ).toBeVisible();
});