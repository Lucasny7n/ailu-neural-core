import { describe, expect, it } from "vitest";
import { classifyOperatorIntent, resolveIntentWithActiveContext } from "./intentRouter";
import type { ActiveContext } from "../neural-space/galaxyGraph";

describe("classifyOperatorIntent", () => {
  it.each([
    ["oi", "conversation", false],
    ["o que é zram?", "explain", false],
    ["minha zram está boa?", "safe-diagnostic", false],
    ["otimiza minha zram", "system-action", true],
    ["apaga steam", "system-action", true],
    ["esse visual tá feio", "app-feedback", false],
    ["abre kernel", "app-navigation", false],
    ["reinicia pipewire", "system-action", true],
  ] as const)("classifica %s como %s", (input, expectedIntent, requiresApproval) => {
    const result = classifyOperatorIntent(input);
    expect(result.intent).toBe(expectedIntent);
    expect(result.requiresApproval).toBe(requiresApproval);
  });

  it("usa contexto ativo para pedido referencial curto", () => {
    const context = activeContext("memory-live-orion", "Projeto Orion Brief.pdf", "memory-live-orion");
    const result = resolveIntentWithActiveContext("resuma isso", classifyOperatorIntent("resuma isso"), context);
    expect(result.activeContextUsed).toBe(true);
    expect(result.intent.targetNodes).toEqual(["memory-live-orion"]);
    expect(result.intent.requiresApproval).toBe(false);
  });

  it("não aplica contexto ativo em saudação simples", () => {
    const context = activeContext("core", "Ailu Neural Core", "core");
    const result = resolveIntentWithActiveContext("oi", classifyOperatorIntent("oi"), context);
    expect(result.activeContextUsed).toBe(false);
    expect(result.intent.intent).toBe("conversation");
  });

  it("ignora contexto ativo quando a ordem aponta outro alvo", () => {
    const context = activeContext("memory-live-orion", "Projeto Orion Brief.pdf", "memory-live-orion");
    const result = resolveIntentWithActiveContext("apaga steam", classifyOperatorIntent("apaga steam"), context);
    expect(result.activeContextUsed).toBe(false);
    expect(result.intent.requiresApproval).toBe(true);
    expect(result.activeContextIgnoredReason).toContain("ignorado");
  });
});

function activeContext(id: string, title: string, nodeId: string): ActiveContext {
  return {
    id,
    kind: "memory-file",
    title,
    nodeId,
    description: "Arquivo de memória selecionado.",
    relatedIds: [],
    createdAt: "2026-05-21T00:00:00.000Z",
  };
}
