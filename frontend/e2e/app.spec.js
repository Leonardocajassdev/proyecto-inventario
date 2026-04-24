import { test, expect } from "@playwright/test";

test("crear producto y visualizarlo", async ({ page }) => {
  test.setTimeout(60000); // 60s para este test

  const consoleMessages = [];
  page.on("console", msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", err => consoleMessages.push(`[pageerror] ${err.message}`));

  await page.goto("/", { timeout: 15000, waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "test-results/debug-initial.png", fullPage: true });
  console.log("URL actual:", page.url());
  console.log("Console msgs:", JSON.stringify(consoleMessages));

  const bodyText = await page.locator("body").innerText().catch(() => "ERROR leyendo body");
  console.log("Body text:", bodyText.substring(0, 800));

  const inputs = await page.locator("input").count();
  console.log("Inputs encontrados:", inputs);

  const buttons = await page.locator("button").allInnerTexts();
  console.log("Botones encontrados:", JSON.stringify(buttons));

  const productName = "Producto E2E " + Date.now();

  await page.getByPlaceholder("Ej. Laptop Dell XPS").fill(productName);
  await page.getByPlaceholder("Descripción opcional").fill("Descripción E2E");
  await page.getByPlaceholder("0").first().fill("5");

  const [postResponse] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes("/products") && res.request().method() === "POST",
      { timeout: 15000 }
    ),
    page.getByRole("button", { name: /crear producto/i }).click(),
  ]);

  console.log("POST status:", postResponse.status());
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/debug-after-create.png", fullPage: true });

  await expect(
    page.locator("h3", { hasText: productName })
  ).toBeVisible({ timeout: 8000 });
});