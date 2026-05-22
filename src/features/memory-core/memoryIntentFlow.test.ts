import { describe, expect, it } from "vitest";
import { buildConversationResponse } from "../ai-router/conversationResponder";
import { classifyOperatorIntent } from "../ai-router/intentRouter";
import type { BuiltMemoryContext } from "./memoryTypes";

describe("intent and memory retrieval flow", () => {
  it("answers from recovered decision memory without approval", () => {
    const intent = classifyOperatorIntent("qual foi a decisão sobre o visual do Ailu?");
    const memoryContext: BuiltMemoryContext = {
      summary: "MEMORIA LOCAL RECUPERADA:\n- [decision] Visual Premium: o Ailu nunca deve parecer cartoon",
      notes: [
        {
          id: "note-1",
          path: "notes/decisions/visual.md",
          title: "Visual Premium",
          kind: "decision",
          summary: "o Ailu nunca deve parecer cartoon",
          pinned: false,
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      chunks: [
        {
          id: "chunk-1",
          noteId: "note-1",
          chunkIndex: 0,
          content: "O Ailu nunca deve parecer cartoon, infantil ou demo de bolinhas neon.",
          tokenEstimate: 16,
        },
      ],
      graphEdges: [],
      sourceLabels: ["[decision] Visual Premium"],
      totalChars: 72,
      reason: "test",
    };

    const response = buildConversationResponse("qual foi a decisão sobre o visual do Ailu?", intent, memoryContext);
    expect(intent.requiresApproval).toBe(false);
    expect(response.body).toContain("cartoon");
    expect(response.body).toContain("Memórias usadas");
  });

  it("keeps destructive action behind approval", () => {
    const intent = classifyOperatorIntent("apaga steam");
    expect(intent.intent).toBe("system-action");
    expect(intent.requiresApproval).toBe(true);
    expect(intent.responseMode).toBe("action-plan");
  });
});
