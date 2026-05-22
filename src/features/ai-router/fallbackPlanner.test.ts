import { describe, expect, it } from "vitest";
import { defaultAppConfig } from "../config/configTypes";
import { createFallbackPlan } from "./fallbackPlanner";

describe("createFallbackPlan", () => {
  it("gera plano seguro para bluetooth", () => {
    const plan = createFallbackPlan("verifica por que meu bluetooth parou", defaultAppConfig);
    expect(plan.intent).toBe("diagnose");
    expect(plan.requiresConfirmation).toBe(true);
    expect(plan.targetNodes).toContain("bluetooth");
    expect(plan.commands.every((command) => !command.destructive)).toBe(true);
  });

  it("não coloca remoção real no plano inicial do Steam", () => {
    const plan = createFallbackPlan("prepara remoção do steam", defaultAppConfig);
    expect(plan.riskLevel).toBe("high");
    expect(plan.commands.map((command) => command.command).join("\n")).not.toContain("pacman -R");
  });
});
