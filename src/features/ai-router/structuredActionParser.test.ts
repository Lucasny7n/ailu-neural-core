import { describe, expect, it } from "vitest";
import { parseStructuredActionPlan } from "./structuredActionParser";

describe("parseStructuredActionPlan", () => {
  it("normaliza JSON valido de plano", () => {
    const plan = parseStructuredActionPlan(
      JSON.stringify({
        id: "plan-1",
        userRequest: "mostra erros do kernel",
        title: "Kernel",
        description: "Ler journal",
        intent: "query",
        riskLevel: "low",
        riskSummary: "Somente leitura",
        commands: [
          {
            id: "cmd-1",
            command: "journalctl -k --no-pager -n 80",
            description: "Kernel log",
            requiresSudo: false,
            destructive: false,
          },
        ],
        affectedFiles: [],
        affectedPackages: [],
        affectedServices: [],
        targetNodes: ["kernel"],
        requiresConfirmation: true,
        model: "qwen2.5-coder:1.5b",
        provider: "ollama-local",
        createdAt: "2026-05-20T00:00:00.000Z",
      }),
    );

    expect(plan.requiresConfirmation).toBe(true);
    expect(plan.commands[0]?.command).toContain("journalctl");
  });
});
