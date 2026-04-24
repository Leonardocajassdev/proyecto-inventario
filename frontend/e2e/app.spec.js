import { test, expect } from "@playwright/test";

test("crear producto y visualizarlo", async ({ page }) => {
  const responses = [];
  page.on("response", res => {
    if (res.url().includes("/products")) {
      responses.push({ url: res.url(), status: res.status(), method: res.request().method() });
    }
  });

  await page.goto("/");

  const productName = "Producto E2E " + Date.now();

  // Usar placeholder para identificar cada input con precisión
  await page.getByPlaceholder("Ej. Laptop Dell XPS").fill(productName);
  await page.getByPlaceholder("Descripción opcional").fill("Descripción E2E");
  await page.getByPlaceholder("0").first().fill("5"); // Stock mínimo

  const [postResponse] = await Promise.all([
    page.waitForResponse(res =>
      res.url().includes("/products") && res.request().method() === "POST"
    ),
    // Usar name insensible a mayúsculas
    page.getByRole("button", { name: /crear producto/i }).click(),
  ]);

  console.log("POST status:", postResponse.status());

  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/debug-after-create.png", fullPage: true });

  await expect(
    page.locator("h3", { hasText: productName })
  ).toBeVisible({ timeout: 8000 });
});