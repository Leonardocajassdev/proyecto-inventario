import { test, expect } from "@playwright/test";

test("crear producto y visualizarlo", async ({ page }) => {
  await page.goto("/");

  // Esperar a que la página esté completamente cargada:
  // el fetch inicial de productos termina y el DOM se estabiliza
  await page.waitForLoadState("networkidle");

  const productName = "Producto E2E " + Date.now();

  // Usar placeholder para identificar cada input con precisión
  const nameInput = page.getByPlaceholder("Ej. Laptop Dell XPS");
  const descInput = page.getByPlaceholder("Descripción opcional");
  const minStockInput = page.getByPlaceholder("0").first();

  // Esperar que el input esté estable en el DOM antes de interactuar
  await nameInput.waitFor({ state: "visible" });
  await nameInput.fill(productName);

  await descInput.waitFor({ state: "visible" });
  await descInput.fill("Descripción E2E");

  await minStockInput.waitFor({ state: "visible" });
  await minStockInput.fill("5");

  // Esperar la respuesta del POST antes de continuar
  const [postResponse] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes("/products") && res.request().method() === "POST"
    ),
    page.getByRole("button", { name: /crear producto/i }).click(),
  ]);

  console.log("POST status:", postResponse.status());

  // Esperar que la lista se actualice con networkidle
  await page.waitForLoadState("networkidle");

  await page.screenshot({ path: "test-results/debug-after-create.png", fullPage: true });

  await expect(
    page.locator("h3", { hasText: productName })
  ).toBeVisible({ timeout: 8000 });
});