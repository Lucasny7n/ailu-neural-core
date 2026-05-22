import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryContextPanel } from "./MemoryContextPanel";
import { MemoryCoreView } from "./MemoryCoreView";

describe("Memory Core UI", () => {
  it("renders the functional memory core view", async () => {
    render(<MemoryCoreView />);
    expect(screen.getByText("Núcleo de Memória Ailu")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Vault local, SQLite, busca e contexto real")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Buscar no vault local...")).toBeInTheDocument();
    expect(screen.getByText("Grafo de Memória")).toBeInTheDocument();
  });

  it("renders memory context panel", async () => {
    render(<MemoryContextPanel />);
    expect(screen.getByText("Contexto de Memória")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/notas/).length).toBeGreaterThan(0));
  });
});
