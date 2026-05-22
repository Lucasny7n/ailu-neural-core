import { describe, expect, it } from "vitest";
import { useMemoryStore } from "./useMemoryStore";

describe("useMemoryStore", () => {
  it("initializes, captures and builds context", async () => {
    const store = useMemoryStore.getState();
    await store.initVault();
    const detail = await store.captureDecision("o Ailu nunca deve parecer cartoon");
    expect(detail.note.kind).toBe("decision");

    const context = await useMemoryStore.getState().buildContext("qual foi a decisao sobre cartoon?", "question");
    expect(context.notes.some((note) => note.id === detail.note.id)).toBe(true);
    expect(useMemoryStore.getState().lastBuiltContext?.notes.length).toBeGreaterThan(0);
  });
});
