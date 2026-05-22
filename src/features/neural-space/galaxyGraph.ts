import type { MemoryGraph, MemoryGraphNode } from "../memory-core/memoryTypes";

export type GalaxyObjectKind =
  | "core"
  | "star"
  | "planet"
  | "moon"
  | "memory-note"
  | "memory-file"
  | "system-component"
  | "hardware-component"
  | "action"
  | "connection";

export type GalaxyDomain =
  | "core"
  | "memory"
  | "ai"
  | "system"
  | "interface"
  | "hardware"
  | "cpu"
  | "gpu"
  | "ram"
  | "storage"
  | "connectivity"
  | "audio"
  | "actions"
  | "logs"
  | "settings";

export interface GalaxyObject {
  id: string;
  kind: GalaxyObjectKind;
  domain: GalaxyDomain;
  label: string;
  subtitle?: string;
  description?: string;
  position: [number, number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
  parentId?: string;
  memoryNoteId?: string;
  sourcePath?: string;
  status?: "idle" | "active" | "online" | "warning" | "approval" | "error" | "success";
  colorRole?: "core" | "memory" | "system" | "hardware" | "action" | "audio" | "connectivity";
  relatedIds: string[];
}

export interface GalaxyConnection {
  id: string;
  fromId: string;
  toId: string;
  relation: string;
  strength: number;
  colorRole?: GalaxyObject["colorRole"];
  active?: boolean;
}

export type ActiveContextKind =
  | "core"
  | "star"
  | "planet"
  | "memory-note"
  | "memory-file"
  | "system-component"
  | "hardware-component"
  | "action"
  | "diagnostic"
  | "connection";

export interface ActiveContext {
  id: string;
  kind: ActiveContextKind;
  title: string;
  subtitle?: string;
  description?: string;
  domain?: string;
  sourcePath?: string;
  memoryNoteId?: string;
  nodeId?: string;
  relatedIds: string[];
  createdAt: string;
}

export const galaxyRoleColors: Record<NonNullable<GalaxyObject["colorRole"]>, string> = {
  core: "#38d5ff",
  memory: "#c247ff",
  system: "#38d5ff",
  hardware: "#0f8cff",
  action: "#ff9f2f",
  audio: "#9a74ff",
  connectivity: "#66f2b0",
};

export const galaxyStatusLabels: Record<NonNullable<GalaxyObject["status"]>, string> = {
  idle: "Em espera",
  active: "Ativo",
  online: "Online",
  warning: "Atenção",
  approval: "Aprovação",
  error: "Erro",
  success: "Pronto",
};

export const GALAXY_SCALE = 3.5;

function object(input: GalaxyObject): GalaxyObject {
  const scaledPosition: [number, number, number] = [
    input.position[0] * GALAXY_SCALE,
    input.position[1] * GALAXY_SCALE,
    input.position[2] * GALAXY_SCALE,
  ];
  return { ...input, position: scaledPosition };
}

export const galaxyObjects: GalaxyObject[] = [
  object({
    id: "core",
    kind: "core",
    domain: "core",
    label: "Ailu Neural Core",
    subtitle: "Núcleo operacional",
    description: "Centro da galáxia neural. Coordena conversa, contexto ativo, memória e planos protegidos por aprovação.",
    position: [0, 0, 0],
    status: "online",
    colorRole: "core",
    relatedIds: ["memory", "ai", "system", "actions"],
  }),
  object({
    id: "memory",
    kind: "star",
    domain: "memory",
    label: "Memória",
    subtitle: "Vault local e contexto",
    description: "Notas, arquivos, decisões, conversas e relações recuperadas pelo Núcleo de Memória.",
    position: [-5.5, 2.2, -3.2],
    status: "active",
    colorRole: "memory",
    relatedIds: ["memory-notes", "memory-files", "memory-decisions", "ai-recovered-context"],
  }),
  object({
    id: "ai",
    kind: "star",
    domain: "ai",
    label: "IA",
    subtitle: "Modelo e roteamento",
    description: "Camada de modelo local, prompt ativo, contexto recuperado e histórico de conversa.",
    position: [4.8, -2.1, -1.8],
    status: "online",
    colorRole: "core",
    relatedIds: ["ollama", "ai-current-model", "memory"],
  }),
  object({
    id: "system",
    kind: "star",
    domain: "system",
    label: "Sistema",
    subtitle: "Arch, systemd e pacotes",
    description: "Leitura segura de kernel, serviços, logs e pacotes. Ações reais continuam protegidas.",
    position: [6.2, 2.5, 2.8],
    status: "idle",
    colorRole: "system",
    relatedIds: ["kernel", "systemd", "packages", "logs"],
  }),
  object({
    id: "interface",
    kind: "star",
    domain: "interface",
    label: "Interface",
    subtitle: "Hyprland e sessão visual",
    description: "Região da sessão gráfica: Hyprland, monitores, workspaces, janelas e Quickshell.",
    position: [-5.8, -1.8, 2.2],
    status: "idle",
    colorRole: "system",
    relatedIds: ["hyprland", "monitors", "workspaces", "windows"],
  }),
  object({
    id: "hardware",
    kind: "star",
    domain: "hardware",
    label: "Hardware",
    subtitle: "Dispositivos e drivers",
    description: "Mapa dos componentes físicos e drivers sem alteração automática.",
    position: [3.2, 4.4, -4.5],
    status: "idle",
    colorRole: "hardware",
    relatedIds: ["cpu", "gpu", "ram-zram", "storage"],
  }),
  object({
    id: "cpu",
    kind: "star",
    domain: "cpu",
    label: "CPU",
    subtitle: "Processamento",
    description: "Carga, processos e pressão de CPU.",
    position: [1.6, 5.8, -3.2],
    status: "idle",
    colorRole: "hardware",
    relatedIds: ["hardware", "system"],
  }),
  object({
    id: "gpu",
    kind: "star",
    domain: "gpu",
    label: "GPU",
    subtitle: "Radeon, Mesa e Vulkan",
    description: "Estado visual e gráfico, ligado ao Hyprland e ao stack Mesa/RADV.",
    position: [5.6, 4.8, -4.4],
    status: "idle",
    colorRole: "hardware",
    relatedIds: ["hardware", "hyprland", "drivers"],
  }),
  object({
    id: "ram-zram",
    kind: "star",
    domain: "ram",
    label: "RAM/ZRAM",
    subtitle: "Memória e swap comprimido",
    description: "Uso de RAM, pressão de memória, swap e ZRAM.",
    position: [5.4, -4.2, -3.6],
    status: "idle",
    colorRole: "hardware",
    relatedIds: ["zram", "memory-pressure", "hardware"],
  }),
  object({
    id: "storage",
    kind: "star",
    domain: "storage",
    label: "Armazenamento",
    subtitle: "Disco e vault",
    description: "Discos, uso local e relação com o vault de memória.",
    position: [6.8, -3.4, 2.5],
    status: "idle",
    colorRole: "hardware",
    relatedIds: ["disk", "memory", "packages"],
  }),
  object({
    id: "connectivity",
    kind: "star",
    domain: "connectivity",
    label: "Conectividade",
    subtitle: "Rede, Bluetooth e DNS",
    description: "Rede local, Bluetooth, DNS e rotas.",
    position: [-6.2, -4.5, 3.8],
    status: "idle",
    colorRole: "connectivity",
    relatedIds: ["network", "bluetooth", "dns"],
  }),
  object({
    id: "audio",
    kind: "star",
    domain: "audio",
    label: "Áudio",
    subtitle: "PipeWire e dispositivos",
    description: "PipeWire, WirePlumber, sinks, sources e dispositivos de áudio.",
    position: [-1.4, -6.2, 4.5],
    status: "idle",
    colorRole: "audio",
    relatedIds: ["pipewire", "wireplumber", "audio-devices"],
  }),
  object({
    id: "actions",
    kind: "star",
    domain: "actions",
    label: "Ações",
    subtitle: "Planos e aprovações",
    description: "Planos, aprovações, execuções e histórico. Nada executa sem autorização explícita.",
    position: [0.0, -5.8, -2.5],
    status: "approval",
    colorRole: "action",
    relatedIds: ["plans", "approvals", "executions", "action-history"],
  }),

  object({
    id: "memory-notes",
    kind: "planet",
    domain: "memory",
    label: "Notas",
    description: "Notas reais do vault quando existirem.",
    position: [-7.2, 2.6, -4.2],
    orbitRadius: 2.8,
    orbitSpeed: 0.12,
    parentId: "memory",
    status: "idle",
    colorRole: "memory",
    relatedIds: ["memory-files", "memory-decisions"],
  }),
  object({
    id: "memory-files",
    kind: "planet",
    domain: "memory",
    label: "Arquivos",
    description: "Arquivos importados para o Núcleo de Memória.",
    position: [-6.5, 1.2, -5.2],
    orbitRadius: 3.5,
    orbitSpeed: 0.08,
    parentId: "memory",
    status: "idle",
    colorRole: "memory",
    relatedIds: ["memory-notes", "storage"],
  }),
  object({
    id: "memory-decisions",
    kind: "planet",
    domain: "memory",
    label: "Decisões",
    description: "Decisões salvas pelo operador e usadas como contexto.",
    position: [-4.2, 3.4, -4.8],
    orbitRadius: 2.5,
    orbitSpeed: 0.1,
    parentId: "memory",
    status: "success",
    colorRole: "memory",
    relatedIds: ["actions", "memory-rules"],
  }),
  object({ id: "ai-current-model", kind: "planet", domain: "ai", label: "Modelo Atual", description: "Modelo padrão configurado para o roteador local.", position: [6.4, -1.4, -3.2], orbitRadius: 2.2, orbitSpeed: 0.11, parentId: "ai", status: "online", colorRole: "core", relatedIds: ["ollama"] }),
  object({ id: "ollama", kind: "planet", domain: "ai", label: "Ollama", description: "Runtime local consultado via API quando disponível.", position: [5.8, -2.8, -0.8], orbitRadius: 3.2, orbitSpeed: 0.07, parentId: "ai", status: "online", colorRole: "core", relatedIds: ["ai-current-model", "ai-recovered-context"] }),
  object({ id: "kernel", kind: "system-component", domain: "system", label: "Kernel", description: "Versão, módulos, parâmetros e logs do kernel.", position: [7.8, 3.8, 1.8], orbitRadius: 2.4, orbitSpeed: 0.1, parentId: "system", status: "idle", colorRole: "system", relatedIds: ["logs", "drivers"] }),
  object({ id: "systemd", kind: "system-component", domain: "system", label: "Systemd", description: "Serviços, unidades falhando e estado do boot atual.", position: [6.8, 1.2, 4.4], orbitRadius: 3.1, orbitSpeed: 0.08, parentId: "system", status: "idle", colorRole: "system", relatedIds: ["services", "logs"] }),
  object({ id: "hyprland", kind: "planet", domain: "interface", label: "Hyprland", description: "Compositor Wayland e centro da sessão visual.", position: [-7.6, -2.5, 3.5], orbitRadius: 2.6, orbitSpeed: 0.09, parentId: "interface", status: "idle", colorRole: "system", relatedIds: ["gpu", "monitors"] }),
  object({ id: "network", kind: "planet", domain: "connectivity", label: "Rede", description: "NetworkManager, interfaces e conectividade.", position: [-8.2, -5.8, 3.2], orbitRadius: 2.8, orbitSpeed: 0.08, parentId: "connectivity", status: "idle", colorRole: "connectivity", relatedIds: ["dns"] }),
  object({ id: "pipewire", kind: "planet", domain: "audio", label: "PipeWire", description: "Servidor de áudio e vídeo da sessão.", position: [-0.2, -8.2, 5.8], orbitRadius: 2.7, orbitSpeed: 0.09, parentId: "audio", status: "idle", colorRole: "audio", relatedIds: ["wireplumber"] }),
  object({ id: "plans", kind: "action", domain: "actions", label: "Planos", description: "Planos gerados pela IA antes da aprovação.", position: [-2.2, -7.5, -3.8], orbitRadius: 2.5, orbitSpeed: 0.08, parentId: "actions", status: "approval", colorRole: "action", relatedIds: ["approvals"] }),
  object({ id: "approvals", kind: "action", domain: "actions", label: "Aprovações", description: "Camada obrigatória antes de qualquer execução.", position: [1.8, -7.8, -4.2], orbitRadius: 3.2, orbitSpeed: 0.07, parentId: "actions", status: "approval", colorRole: "action", relatedIds: ["approval-layer", "executions"] }),
];

export const galaxyConnections: GalaxyConnection[] = [
  ...["memory", "ai", "system", "interface", "hardware", "cpu", "gpu", "ram-zram", "storage", "connectivity", "audio", "actions"].map(
    (id) => ({ id: `core-${id}`, fromId: "core", toId: id, relation: "órbita principal", strength: 0.95, colorRole: id === "actions" ? "action" : id === "memory" ? "memory" : "core" }) satisfies GalaxyConnection,
  ),
  { id: "memory-ai-context", fromId: "memory", toId: "ai-recovered-context", relation: "contexto recuperado", strength: 0.92, colorRole: "memory", active: true },
  { id: "ai-prompt-context", fromId: "ai-active-prompt", toId: "ai-recovered-context", relation: "injeta contexto", strength: 0.82, colorRole: "core", active: true },
  { id: "memory-actions", fromId: "memory-saved-actions", toId: "actions", relation: "histórico operacional", strength: 0.78, colorRole: "action" },
  { id: "approval-rules", fromId: "approval-layer", toId: "memory-rules", relation: "regras de segurança", strength: 0.86, colorRole: "action" },
  { id: "system-logs", fromId: "system", toId: "logs", relation: "telemetria", strength: 0.72, colorRole: "system" },
  { id: "kernel-drivers", fromId: "kernel", toId: "drivers", relation: "módulos", strength: 0.68, colorRole: "hardware" },
  { id: "gpu-hyprland", fromId: "gpu", toId: "hyprland", relation: "renderização", strength: 0.82, colorRole: "hardware" },
  { id: "storage-memory", fromId: "storage", toId: "memory-files", relation: "arquivos importados", strength: 0.74, colorRole: "memory" },
  { id: "network-dns", fromId: "network", toId: "dns", relation: "resolução", strength: 0.68, colorRole: "connectivity" },
  { id: "pipewire-wireplumber", fromId: "pipewire", toId: "wireplumber", relation: "gerência", strength: 0.78, colorRole: "audio" },
  { id: "ram-zram-pressure", fromId: "ram-zram", toId: "memory-pressure", relation: "pressão", strength: 0.72, colorRole: "hardware" },
  { id: "plans-approvals", fromId: "plans", toId: "approvals", relation: "aguarda autorização", strength: 0.9, colorRole: "action", active: true },
  { id: "approvals-executions", fromId: "approvals", toId: "executions", relation: "libera execução", strength: 0.7, colorRole: "action" },
  ...galaxyObjects
    .filter((item) => item.parentId)
    .map((item) => ({
      id: `${item.parentId}-${item.id}`,
      fromId: item.parentId ?? "core",
      toId: item.id,
      relation: "subórbita",
      strength: item.kind === "star" ? 0.86 : 0.48,
      colorRole: item.colorRole,
    }) satisfies GalaxyConnection),
];

export const galaxyObjectById = new Map(galaxyObjects.map((item) => [item.id, item]));
export const galaxyConnectionById = new Map(galaxyConnections.map((item) => [item.id, item]));

export function getGalaxyChildren(parentId: string): GalaxyObject[] {
  return galaxyObjects.filter((item) => item.parentId === parentId);
}

export function getGalaxyPath(objectId: string): GalaxyObject[] {
  const objectItem = galaxyObjectById.get(objectId);
  if (!objectItem) {
    return [galaxyObjectById.get("core") ?? galaxyObjects[0]];
  }
  const path: GalaxyObject[] = [];
  let cursor: GalaxyObject | undefined = objectItem;
  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parentId ? galaxyObjectById.get(cursor.parentId) : undefined;
  }
  return path;
}

export function getRelatedGalaxyObjects(objectId: string): GalaxyObject[] {
  const objectItem = galaxyObjectById.get(objectId);
  if (!objectItem) {
    return [];
  }
  const ids = new Set([
    ...objectItem.relatedIds,
    ...galaxyConnections
      .filter((connection) => connection.fromId === objectId || connection.toId === objectId)
      .map((connection) => (connection.fromId === objectId ? connection.toId : connection.fromId)),
  ]);
  return [...ids].flatMap((id) => {
    const related = galaxyObjectById.get(id);
    return related ? [related] : [];
  });
}

export function toActiveContext(objectItem: GalaxyObject): ActiveContext {
  return {
    id: objectItem.id,
    kind: toActiveContextKind(objectItem),
    title: objectItem.label,
    subtitle: objectItem.subtitle,
    description: objectItem.description,
    domain: objectItem.domain,
    sourcePath: objectItem.sourcePath,
    memoryNoteId: objectItem.memoryNoteId,
    nodeId: objectItem.id,
    relatedIds: objectItem.relatedIds,
    createdAt: new Date().toISOString(),
  };
}

export function connectionToActiveContext(connection: GalaxyConnection): ActiveContext {
  const from = galaxyObjectById.get(connection.fromId);
  const to = galaxyObjectById.get(connection.toId);
  return {
    id: connection.id,
    kind: "connection",
    title: `${from?.label ?? connection.fromId} → ${to?.label ?? connection.toId}`,
    subtitle: connection.relation,
    description: `Relação neural: ${connection.relation}. Força ${Math.round(connection.strength * 100)}%.`,
    domain: from?.domain ?? to?.domain,
    nodeId: to?.id ?? from?.id,
    relatedIds: [connection.fromId, connection.toId],
    createdAt: new Date().toISOString(),
  };
}

export function colorForGalaxyObject(objectItem: GalaxyObject): string {
  return galaxyRoleColors[objectItem.colorRole ?? "core"];
}

export function colorForGalaxyConnection(connection: GalaxyConnection): string {
  return galaxyRoleColors[connection.colorRole ?? "core"];
}

export function statusLabelForGalaxy(objectItem: GalaxyObject): string {
  return galaxyStatusLabels[objectItem.status ?? "idle"];
}

export function buildMemoryGalaxy(memoryGraph: MemoryGraph): {
  objects: GalaxyObject[];
  connections: GalaxyConnection[];
} {
  if (!memoryGraph.nodes.length) {
    return { objects: [], connections: [] };
  }

  const edgeRelated = new Map<string, Set<string>>();
  memoryGraph.edges.forEach((edge) => {
    if (!edgeRelated.has(edge.fromId)) {
      edgeRelated.set(edge.fromId, new Set());
    }
    if (!edgeRelated.has(edge.toId)) {
      edgeRelated.set(edge.toId, new Set());
    }
    edgeRelated.get(edge.fromId)?.add(memoryGalaxyObjectId(edge.toId));
    edgeRelated.get(edge.toId)?.add(memoryGalaxyObjectId(edge.fromId));
  });

  const objects = memoryGraph.nodes.slice(0, 28).map((nodeItem, index) => {
    const kind = memoryGalaxyKind(nodeItem);
    const parentId = memoryParentForKind(kind, nodeItem.kind);
    const ring = index % 4;
    const angle = (index / Math.max(memoryGraph.nodes.slice(0, 28).length, 1)) * Math.PI * 2;
    const radius = 2.4 + ring * 0.85;
    return object({
      id: memoryGalaxyObjectId(nodeItem.id),
      kind,
      domain: "memory",
      label: nodeItem.label,
      subtitle: memoryKindLabel(nodeItem.kind),
      description:
        typeof nodeItem.metadata?.summary === "string"
          ? nodeItem.metadata.summary
          : "Memória real indexada no vault local.",
      position: [-5.5 + Math.cos(angle) * radius, 2.2 + Math.sin(index * 0.7) * 0.85, -3.2 + Math.sin(angle) * radius],
      orbitRadius: 1.8 + ring * 0.45,
      orbitSpeed: 0.055 + (index % 5) * 0.008,
      parentId,
      memoryNoteId: nodeItem.noteId,
      sourcePath: typeof nodeItem.metadata?.sourcePath === "string" ? nodeItem.metadata.sourcePath : undefined,
      status: nodeItem.kind === "decision" || nodeItem.kind === "rule" ? "success" : "active",
      colorRole: nodeItem.kind === "action" ? "action" : "memory",
      relatedIds: [...(edgeRelated.get(nodeItem.id) ?? [])],
    });
  });

  const objectIds = new Set(objects.map((item) => item.id));
  const connections: GalaxyConnection[] = [
    ...objects.map((item) => ({
      id: `memory-live-${item.id}`,
      fromId: item.parentId ?? "memory",
      toId: item.id,
      relation: "memória real",
      strength: 0.5,
      colorRole: item.colorRole,
    }) satisfies GalaxyConnection),
    ...memoryGraph.edges.slice(0, 72).flatMap((edge) => {
      const fromId = memoryGalaxyObjectId(edge.fromId);
      const toId = memoryGalaxyObjectId(edge.toId);
      if (!objectIds.has(fromId) || !objectIds.has(toId)) {
        return [];
      }
      return [
        {
          id: `memory-edge-${edge.id}`,
          fromId,
          toId,
          relation: edge.relation,
          strength: Math.min(1, Math.max(0.18, edge.weight / 3)),
          colorRole: "memory" as const,
          active: edge.weight > 1.4,
        },
      ];
    }),
  ];

  return { objects, connections };
}

export function memoryGalaxyObjectId(memoryNodeId: string): string {
  return `memory-live-${memoryNodeId}`;
}

function toActiveContextKind(objectItem: GalaxyObject): ActiveContextKind {
  if (objectItem.kind === "moon") {
    return "planet";
  }
  if (objectItem.kind === "connection") {
    return "connection";
  }
  return objectItem.kind;
}

function memoryGalaxyKind(nodeItem: MemoryGraphNode): GalaxyObjectKind {
  if (nodeItem.kind === "import" || nodeItem.kind === "file") {
    return "memory-file";
  }
  if (nodeItem.kind === "action") {
    return "action";
  }
  return "memory-note";
}

function memoryParentForKind(kind: GalaxyObjectKind, rawKind: string): string {
  if (kind === "memory-file" || rawKind === "import") {
    return "memory-files";
  }
  if (rawKind === "decision") {
    return "memory-decisions";
  }
  if (rawKind === "conversation") {
    return "memory-conversations";
  }
  if (rawKind === "rule") {
    return "memory-rules";
  }
  if (rawKind === "project") {
    return "memory-projects";
  }
  if (kind === "action") {
    return "memory-saved-actions";
  }
  return "memory-notes";
}

function memoryKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    note: "Nota",
    project: "Projeto",
    system: "Sistema",
    conversation: "Conversa",
    decision: "Decisão",
    action: "Ação",
    rule: "Regra",
    import: "Arquivo",
  };
  return labels[kind] ?? "Memória";
}
