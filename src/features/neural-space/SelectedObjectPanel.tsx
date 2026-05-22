import { useMemo, useState } from "react";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";
import {
  buildMemoryGalaxy,
  colorForGalaxyObject,
  galaxyConnectionById,
  galaxyConnections,
  galaxyObjectById,
  galaxyObjects,
  getGalaxyChildren,
  getRelatedGalaxyObjects,
  statusLabelForGalaxy,
  toActiveContext,
  type ActiveContext,
  type GalaxyConnection,
  type GalaxyObject,
} from "./galaxyGraph";

export function SelectedObjectPanel(): JSX.Element {
  const selectedGalaxyObjectId = useNeuralStore((state) => state.selectedGalaxyObjectId);
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId);
  const setRoute = useNeuralStore((state) => state.setRoute);
  const selectGalaxyObject = useNeuralStore((state) => state.selectGalaxyObject);
  const selectGalaxyConnection = useNeuralStore((state) => state.selectGalaxyConnection);
  const setActiveContext = useNeuralStore((state) => state.setActiveContext);
  const queueConsoleCommand = useNeuralStore((state) => state.queueConsoleCommand);
  const returnToCore = useNeuralStore((state) => state.returnToCore);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const memoryGraph = useMemoryStore((state) => state.graph);
  const memoryStats = useMemoryStore((state) => state.stats);
  const pinNote = useMemoryStore((state) => state.pinNote);
  const forgetNote = useMemoryStore((state) => state.forgetNote);
  const getNote = useMemoryStore((state) => state.getNote);
  const [busyMemoryAction, setBusyMemoryAction] = useState<"pin" | "forget" | null>(null);

  const dynamicMemory = useMemo(() => buildMemoryGalaxy(memoryGraph), [memoryGraph]);
  const objectMap = useMemo(() => new Map([...galaxyObjects, ...dynamicMemory.objects].map((object) => [object.id, object])), [dynamicMemory.objects]);
  const connectionMap = useMemo(
    () => new Map([...galaxyConnections, ...dynamicMemory.connections].map((connection) => [connection.id, connection])),
    [dynamicMemory.connections],
  );
  const selectedObject = objectMap.get(selectedGalaxyObjectId) ?? galaxyObjectById.get("core") ?? galaxyObjects[0];
  const selectedConnection = selectedConnectionId ? connectionMap.get(selectedConnectionId) ?? galaxyConnectionById.get(selectedConnectionId) : undefined;

  if (selectedConnection) {
    return (
      <aside className="hud-panel right-panel selected-object-panel hud-corners">
        <div className="hud-kicker">Conexão neural</div>
        <h2 className="hud-title">{connectionTitle(selectedConnection, objectMap)}</h2>
        <p>{connectionDescription(selectedConnection, objectMap)}</p>
        <div className="detail-grid">
          <span>Origem</span>
          <strong>{objectMap.get(selectedConnection.fromId)?.label ?? selectedConnection.fromId}</strong>
          <span>Destino</span>
          <strong>{objectMap.get(selectedConnection.toId)?.label ?? selectedConnection.toId}</strong>
          <span>Relação</span>
          <strong>{selectedConnection.relation}</strong>
          <span>Força</span>
          <strong>{Math.round(selectedConnection.strength * 100)}%</strong>
        </div>
        <div className="panel-actions">
          <button type="button" onClick={() => selectGalaxyObject(selectedConnection.toId)}>
            Viajar pela conexão
          </button>
          <button type="button" onClick={() => selectGalaxyObject(selectedConnection.toId)}>
            Explorar destino
          </button>
          <button
            type="button"
            onClick={() => {
              const context = contextFromConnection(selectedConnection, objectMap);
              setActiveContext(context);
              selectGalaxyConnection(selectedConnection.id, context);
              addTelemetry({ level: "success", message: `Contexto ativo: ${context.title}` });
            }}
          >
            Usar relação
          </button>
          <button type="button" onClick={returnToCore}>
            Voltar ao Núcleo
          </button>
        </div>
      </aside>
    );
  }

  const children = [...getGalaxyChildren(selectedObject.id), ...dynamicMemory.objects.filter((object) => object.parentId === selectedObject.id)];
  const objectConnections = [...connectionMap.values()]
    .filter((connection) => connection.fromId === selectedObject.id || connection.toId === selectedObject.id)
    .slice(0, 8);
  const related = [
    ...getRelatedGalaxyObjects(selectedObject.id),
    ...selectedObject.relatedIds.flatMap((id) => {
      const item = objectMap.get(id);
      return item ? [item] : [];
    }),
  ].filter((item, index, items) => items.findIndex((other) => other.id === item.id) === index);
  const isMemoryObject = selectedObject.domain === "memory" || selectedObject.kind === "memory-note" || selectedObject.kind === "memory-file";
  const canUseMemoryNote = Boolean(selectedObject.memoryNoteId);
  const emptyMemory = selectedObject.id === "memory" && memoryGraph.nodes.length === 0;

  async function handleOpen(): Promise<void> {
    if (selectedObject.memoryNoteId) {
      await getNote(selectedObject.memoryNoteId);
      setRoute("memory");
      return;
    }
    if (selectedObject.domain === "settings") {
      setRoute("settings");
      return;
    }
    if (selectedObject.domain === "memory") {
      setRoute("memory");
      return;
    }
    setRoute("neural");
    selectGalaxyObject(selectedObject.id, toActiveContext(selectedObject));
  }

  async function handlePin(): Promise<void> {
    if (!selectedObject.memoryNoteId || busyMemoryAction) {
      return;
    }
    setBusyMemoryAction("pin");
    try {
      await pinNote(selectedObject.memoryNoteId);
      addTelemetry({ level: "success", message: `Memória fixada: ${selectedObject.label}` });
    } finally {
      setBusyMemoryAction(null);
    }
  }

  async function handleForget(): Promise<void> {
    if (!selectedObject.memoryNoteId || busyMemoryAction) {
      return;
    }
    setBusyMemoryAction("forget");
    try {
      await forgetNote(selectedObject.memoryNoteId);
      addTelemetry({ level: "warn", message: `Memória esquecida: ${selectedObject.label}` });
      selectGalaxyObject("memory");
    } finally {
      setBusyMemoryAction(null);
    }
  }

  return (
    <aside className="hud-panel right-panel selected-object-panel hud-corners">
      <div className="hud-kicker">{panelKicker(selectedObject)}</div>
      <h2 className="hud-title" style={{ color: colorForGalaxyObject(selectedObject) }}>{selectedObject.label}</h2>
      <div className={`status-pill status-${selectedObject.status ?? "idle"}`}>{statusLabelForGalaxy(selectedObject)}</div>
      <p>{emptyMemory ? "Nenhuma memória indexada. Importe arquivos ou salve decisões para alimentar o núcleo." : selectedObject.description}</p>

      <div className="detail-grid">
        <span>Tipo</span>
        <strong>{kindLabel(selectedObject)}</strong>
        <span>Domínio</span>
        <strong>{domainLabel(selectedObject.domain)}</strong>
        <span>Relações</span>
        <strong>{related.length}</strong>
        <span>Fonte</span>
        <strong>{selectedObject.sourcePath ?? selectedObject.memoryNoteId ?? "interna"}</strong>
      </div>

      {children.length ? (
        <div className="node-relations">
          <span>Planetas</span>
          <div>
            {children.slice(0, 8).map((child) => (
              <button key={child.id} type="button" className="hud-button hud-button--micro" onClick={() => selectGalaxyObject(child.id, toActiveContext(child))}>
                {child.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {objectConnections.length ? (
        <div className="node-relations">
          <span>Ligações</span>
          <div>
            {objectConnections.map((connection) => {
              const context = contextFromConnection(connection, objectMap);
              return (
                <button
                  key={connection.id}
                  type="button"
                  className="hud-button hud-button--micro"
                  onClick={() => selectGalaxyConnection(connection.id, context)}
                >
                  {context.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {related.length ? (
        <div className="node-relations">
          <span>Relações</span>
          <div>
            {related.slice(0, 6).map((item) => (
              <button key={item.id} type="button" className="hud-button hud-button--micro" onClick={() => selectGalaxyObject(item.id, toActiveContext(item))}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isMemoryObject ? (
        <div className="memory-mini-state">
          <span>Núcleo de Memória</span>
          <strong>
            {memoryStats ? `${memoryStats.notes} notas / ${memoryStats.chunks} chunks` : memoryGraph.nodes.length ? `${memoryGraph.nodes.length} nós` : "vazio"}
          </strong>
        </div>
      ) : null}

      <div className="panel-actions">
        <div style={{ gridColumn: "1 / -1", display: "grid", gap: "8px", marginBottom: "4px" }}>
          <button
            type="button"
            className="hud-button hud-button--primary"
            onClick={() => {
              const context = toActiveContext(selectedObject);
              setActiveContext(context);
              addTelemetry({ level: "success", message: `Contexto ativo: ${selectedObject.label}` });
            }}
          >
            Usar como contexto
          </button>
        </div>
        
        <button type="button" onClick={() => void handleOpen()}>
          Abrir
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveContext(toActiveContext(selectedObject));
            queueConsoleCommand("resuma isso");
          }}
        >
          Resumir
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveContext(toActiveContext(selectedObject));
            queueConsoleCommand(`diagnostica ${selectedObject.label}`);
          }}
        >
          Diagnosticar
        </button>
        <button
          type="button"
          onClick={() => {
            const firstChild = children[0];
            if (firstChild) {
              selectGalaxyObject(firstChild.id, toActiveContext(firstChild));
            }
          }}
          disabled={!children.length}
        >
          Explorar
        </button>
        <button type="button" onClick={() => setRoute("diagnostics")}>
          Ver logs
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveContext(toActiveContext(selectedObject));
            queueConsoleCommand(`preparar ação para ${selectedObject.label}`);
          }}
        >
          Preparar ação
        </button>
        <button type="button" onClick={() => void handlePin()} disabled={!canUseMemoryNote || busyMemoryAction !== null}>
          {canUseMemoryNote ? "Fixar memória" : "Fixar"}
        </button>
        <button type="button" onClick={() => void handleForget()} disabled={!canUseMemoryNote || busyMemoryAction !== null}>
          {canUseMemoryNote ? "Esquecer" : "Esquecer"}
        </button>
      </div>
      <button type="button" className="ghost-button hud-button" onClick={returnToCore}>
        Voltar ao Núcleo
      </button>
    </aside>
  );
}

function contextFromConnection(connection: GalaxyConnection, objects: Map<string, GalaxyObject>): ActiveContext {
  const from = objects.get(connection.fromId);
  const to = objects.get(connection.toId);
  return {
    id: connection.id,
    kind: "connection",
    title: connectionTitle(connection, objects),
    subtitle: connection.relation,
    description: connectionDescription(connection, objects),
    domain: from?.domain ?? to?.domain,
    nodeId: to?.id ?? from?.id,
    relatedIds: [connection.fromId, connection.toId],
    createdAt: new Date().toISOString(),
  };
}

function connectionTitle(connection: GalaxyConnection, objects: Map<string, GalaxyObject>): string {
  return `${objects.get(connection.fromId)?.label ?? connection.fromId} → ${objects.get(connection.toId)?.label ?? connection.toId}`;
}

function connectionDescription(connection: GalaxyConnection, objects: Map<string, GalaxyObject>): string {
  return `Relação ${connection.relation} entre ${objects.get(connection.fromId)?.label ?? connection.fromId} e ${objects.get(connection.toId)?.label ?? connection.toId}.`;
}

function panelKicker(object: GalaxyObject): string {
  if (object.kind === "star") {
    return "Estrela selecionada";
  }
  if (object.kind === "memory-note" || object.kind === "memory-file") {
    return "Memória selecionada";
  }
  if (object.kind === "action") {
    return "Ação protegida";
  }
  return "Objeto selecionado";
}

function kindLabel(object: GalaxyObject): string {
  const labels: Record<GalaxyObject["kind"], string> = {
    core: "Núcleo",
    star: "Estrela",
    planet: "Planeta",
    moon: "Lua",
    "memory-note": "Nota de memória",
    "memory-file": "Arquivo de memória",
    "system-component": "Componente do sistema",
    "hardware-component": "Componente de hardware",
    action: "Ação",
    connection: "Conexão",
  };
  return labels[object.kind];
}

function domainLabel(domain: GalaxyObject["domain"]): string {
  const labels: Record<GalaxyObject["domain"], string> = {
    core: "Núcleo",
    memory: "Memória",
    ai: "IA",
    system: "Sistema",
    interface: "Interface",
    hardware: "Hardware",
    cpu: "CPU",
    gpu: "GPU",
    ram: "RAM/ZRAM",
    storage: "Armazenamento",
    connectivity: "Conectividade",
    audio: "Áudio",
    actions: "Ações",
    logs: "Logs",
    settings: "Configurações",
  };
  return labels[domain];
}
