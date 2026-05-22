import { describe, expect, it } from "vitest";
import {
  detectMemoryCapture,
  memoryBuildContext,
  memoryCaptureDecision,
  memoryCaptureRule,
  memorySearch,
} from "./memoryClient";

describe("memoryClient browser fallback", () => {
  it("captures decision and retrieves it as memory context", async () => {
    const detail = await memoryCaptureDecision("o Ailu nunca deve parecer cartoon");
    expect(detail.note.kind).toBe("decision");

    const results = await memorySearch("cartoon", 10);
    expect(results.some((result) => result.note.id === detail.note.id)).toBe(true);

    const context = await memoryBuildContext("qual foi a decisao sobre visual cartoon?", "question");
    expect(context.notes.some((note) => note.id === detail.note.id)).toBe(true);
  });

  it("detects decision and rule capture phrases", () => {
    expect(detectMemoryCapture("salva isso como decisão: manter backend real")).toEqual({
      kind: "decision",
      content: "manter backend real",
    });
    expect(detectMemoryCapture("nunca faça botão fake")).toEqual({
      kind: "rule",
      content: "botão fake",
    });
  });

  it("captures rule without external runtime", async () => {
    const detail = await memoryCaptureRule("sempre recuperar memoria antes de responder");
    expect(detail.note.kind).toBe("rule");
  });
});
