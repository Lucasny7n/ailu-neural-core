import type { MemoryGraph } from "./memoryTypes";

interface MemoryGraphPanelProps {
  graph: MemoryGraph;
}

export function MemoryGraphPanel({ graph }: MemoryGraphPanelProps): JSX.Element {
  const topNodes = graph.nodes.slice(0, 12);
  const topEdges = graph.edges.slice(0, 10);

  return (
    <section className="memory-side-card">
      <header>
        <span className="hud-kicker">Grafo de Memória</span>
        <strong>{graph.nodes.length} nós</strong>
      </header>
      <div className="memory-graph-mini" aria-label="Grafo de memórias">
        {topNodes.map((node, index) => (
          <span
            key={node.id}
            className={`memory-graph-node kind-${node.kind}`}
            style={{
              left: `${12 + ((index * 23) % 76)}%`,
              top: `${16 + ((index * 31) % 68)}%`,
              opacity: Math.min(1, 0.5 + node.weight / 4),
            }}
            title={node.label}
          >
            {node.label.slice(0, 2).toUpperCase()}
          </span>
        ))}
      </div>
      <div className="memory-edge-list">
        {topEdges.length ? (
          topEdges.map((edge) => (
            <code key={edge.id}>
              {edge.relation} {edge.weight.toFixed(1)}
            </code>
          ))
        ) : (
          <code>sem arestas indexadas</code>
        )}
      </div>
    </section>
  );
}
