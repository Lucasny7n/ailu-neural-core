import { expect, test, type Page } from "@playwright/test";

const appUrl = process.env.AILU_NEURAL_CORE_URL ?? "http://localhost:5173";

test.beforeEach(async ({ page }) => {
  await page.route("http://localhost:11434/**", (route) => route.abort());
  await page.route("http://127.0.0.1:11434/**", (route) => route.abort());
  await page.goto(appUrl);
});

test("operator intent examples route to the correct UX layer", async ({ page }) => {
  await submit(page, "oi");
  await expect(page.getByText("Canal do operador ativo")).toBeVisible();
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toHaveCount(0);

  await submit(page, "o que é zram?");
  await expect(page.getByText("ZRAM", { exact: true })).toBeVisible();
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toHaveCount(0);

  await submit(page, "minha zram está boa?");
  await expect(page.getByText("Diagnóstico seguro")).toBeVisible();
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toHaveCount(0);

  await submit(page, "otimiza minha zram");
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toBeVisible();
  await page.getByRole("button", { name: "CANCELAR" }).click();

  await submit(page, "apaga steam");
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toBeVisible();
  await page.getByRole("button", { name: "CANCELAR" }).click();

  await submit(page, "esse visual tá feio");
  await expect(page.getByText("Feedback registrado")).toBeVisible();
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toHaveCount(0);

  await submit(page, "abre kernel");
  await expect(page.locator(".right-panel h2")).toContainText("Kernel");
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toHaveCount(0);

  await submit(page, "reinicia pipewire");
  await expect(page.getByText("AGUARDANDO AUTORIZAÇÃO DO OPERADOR")).toBeVisible();
});

async function submit(page: Page, value: string): Promise<void> {
  await page.getByLabel("Canal de Entrada").fill(value);
  await page.getByRole("button", { name: "Enviar" }).click();
}
