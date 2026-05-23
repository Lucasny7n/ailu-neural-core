import { test } from "@playwright/test";

const appUrl = process.env.AILU_NEURAL_CORE_URL ?? "http://localhost:5173";

test.beforeEach(async ({ page }) => {
  await page.route("http://localhost:11434/**", (route) => route.abort());
  await page.route("http://127.0.0.1:11434/**", (route) => route.abort());
  await page.goto(appUrl);
});

test("Take UI Screenshots", async ({ page }) => {
  // Wait for 3D scene to render
  await page.waitForTimeout(3000);

  // Take screenshot of the exploration mode (default)
  await page.screenshot({ path: "screenshots/exploration_mode.png", fullPage: true });

  // Click on 'Voltar ao cockpit'
  await page.getByRole("button", { name: "Voltar ao cockpit" }).click();
  await page.waitForTimeout(1500);

  // Take screenshot of the cockpit mode
  await page.screenshot({ path: "screenshots/cockpit_mode.png", fullPage: true });

  // Select memory node
  await page.getByRole("button", { name: "Memória" }).click();
  await page.waitForTimeout(1000);

  // Take screenshot of memory selected
  await page.screenshot({ path: "screenshots/memory_selected.png", fullPage: true });

  // Type something that triggers ApprovalLayer
  await page.getByLabel("Canal de Entrada").fill("apaga o vscode");
  await page.getByRole("button", { name: "Enviar" }).click();
  
  // Wait for the ApprovalLayer to show up
  await page.waitForSelector("text=AGUARDANDO AUTORIZAÇÃO DO OPERADOR");
  await page.waitForTimeout(1000);

  // Take screenshot of the ApprovalLayer
  await page.screenshot({ path: "screenshots/approval_layer.png", fullPage: true });
});
