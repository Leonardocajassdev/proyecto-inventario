import { test, expect } from "@playwright/test";

test("crear producto y visualizarlo", async ({ page }) => {
  // Capturar respuestas de red para debug
  const responses = [];
  page.on("response", res => {
    if (res.url().includes("/products")) {
      responses.push({ url: res.url(), status: res.status(), method: res.request().method() });
    }
  });

  // Capturar errores de consola
  const consoleErrors = [];
  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/");

  const productName = "Producto E2E " + Date.now();

  await page.locator("input").nth(0).fill(productName);
  await page.locator("input").nth(1).fill("Descripción E2E");
  await page.locator("input").nth(2).fill("5");

  // Esperar la respuesta del POST antes de continuar
  const [postResponse] = await Promise.all([
    page.waitForResponse(res => res.url().includes("/products") && res.request().method() === "POST"),
    page.getByRole("button", { name: "Crear producto" }).click(),
  ]);

  const postStatus = postResponse.status();
  const postBody = await postResponse.json().catch(() => null);

  console.log("POST status:", postStatus);
  console.log("POST body:", JSON.stringify(postBody));
  console.log("Network calls:", JSON.stringify(responses));
  console.log("Console errors:", JSON.stringify(consoleErrors));

  // Dar tiempo al GET de refresco
  await page.waitForTimeout(1000);

  // Screenshot para ver qué hay en pantalla
  await page.screenshot({ path: "test-results/debug-after-create.png", fullPage: true });

  await expect(
    page.locator("h3", { hasText: productName })
  ).toBeVisible({ timeout: 8000 });
});