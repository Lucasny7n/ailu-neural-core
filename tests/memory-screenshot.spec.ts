import { test } from "@playwright/test";

const appUrl = process.env.AILU_NEURAL_CORE_URL ?? "http://localhost:5173";

test("generate Memory Core screenshots", async ({ page }) => {
  await page.goto(appUrl);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "/tmp/ailu-neural-core-v5-memory-core.png", fullPage: true });

  await page.getByRole("button", { name: "Memory Core" }).click();
  await page.getByPlaceholder("Nova nota...").fill("Visual Premium");
  await page.locator("select").selectOption("decision");
  await page.getByRole("button", { name: "Criar" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Reindexar" }).click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: "/tmp/ailu-neural-core-v5-memory-view.png", fullPage: true });
  await page.locator(".memory-graph-mini").screenshot({ path: "/tmp/ailu-neural-core-v5-memory-graph.png" });
});
