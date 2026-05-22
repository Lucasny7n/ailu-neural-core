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

function object(input: GalaxyObject): GalaxyObject {
  return input;
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
    position: [-4.8, -2.2, -2.4],
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
    position: [4.9, 1.1, -1.1],
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
    position: [-5.2, 1.9, 1.4],
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
    position: [-1.5, 3.7, 3.2],
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
    position: [2.6, 2.9, -3.6],
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
    position: [1.0, 5.1, -2.3],
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
    position: [5.0, 3.5, -3.8],
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
    position: [3.5, -0.6, -4.8],
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
    position: [5.2, -2.6, 0.8],
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
    position: [-4.1, -3.7, 2.6],
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
    position: [1.2, -4.3, 3.3],
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
    position: [-0.3, -5.1, -1.2],
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
    position: [-6.2, -1.6, -3.0],
    orbitRadius: 1.35,
    orbitSpeed: 0.14,
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
    position: [-5.3, -3.6, -3.8],
    orbitRadius: 1.8,
    orbitSpeed: 0.1,
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
    position: [-3.2, -2.4, -3.3],
    orbitRadius: 1.55,
    orbitSpeed: 0.12,
    parentId: "memory",
    status: "success",
    colorRole: "memory",
    relatedIds: ["actions", "memory-rules"],
  }),
  object({
    id: "memory-conversations",
    kind: "planet",
    domain: "memory",
    label: "Conversas",
    description: "Conversas capturadas quando o operador decide salvar.",
    position: [-4.1, -0.9, -1.6],
    orbitRadius: 2.1,
    orbitSpeed: 0.09,
    parentId: "memory",
    status: "idle",
    colorRole: "memory",
    relatedIds: ["ai-history", "memory-notes"],
  }),
  object({
    id: "memory-rules",
    kind: "planet",
    domain: "memory",
    label: "Regras",
    description: "Regras operacionais salvas para orientar decisões futuras.",
    position: [-5.6, -1.1, -0.9],
    orbitRadius: 2.35,
    orbitSpeed: 0.08,
    parentId: "memory",
    status: "idle",
    colorRole: "memory",
    relatedIds: ["memory-decisions", "approval-layer"],
  }),
  object({
    id: "memory-projects",
    kind: "planet",
    domain: "memory",
    label: "Projetos",
    description: "Notas de projeto e contexto de trabalho local.",
    position: [-6.8, -2.9, -2.0],
    orbitRadius: 2.65,
    orbitSpeed: 0.075,
    parentId: "memory",
    status: "idle",
    colorRole: "memory",
    relatedIds: ["memory-files", "ai-recovered-context"],
  }),
  object({
    id: "memory-saved-actions",
    kind: "planet",
    domain: "memory",
    label: "Ações Salvas",
    description: "Planos e execuções persistidos como memória operacional.",
    position: [-3.0, -3.8, -1.8],
    orbitRadius: 2.9,
    orbitSpeed: 0.07,
    parentId: "memory",
    status: "approval",
    colorRole: "action",
    relatedIds: ["actions", "action-history"],
  }),

  object({ id: "ai-current-model", kind: "planet", domain: "ai", label: "Modelo Atual", description: "Modelo padrão configurado para o roteador local.", position: [6.4, 1.4, -1.9], orbitRadius: 1.2, orbitSpeed: 0.12, parentId: "ai", status: "online", colorRole: "core", relatedIds: ["ollama"] }),
  object({ id: "ollama", kind: "planet", domain: "ai", label: "Ollama", description: "Runtime local consultado via API quando disponível.", position: [5.7, 2.5, -0.1], orbitRadius: 1.6, orbitSpeed: 0.09, parentId: "ai", status: "online", colorRole: "core", relatedIds: ["ai-current-model", "ai-recovered-context"] }),
  object({ id: "ai-active-prompt", kind: "planet", domain: "ai", label: "Prompt Ativo", description: "Instruções internas montadas com contexto e segurança.", position: [4.1, 0.4, -2.6], orbitRadius: 1.9, orbitSpeed: 0.08, parentId: "ai", status: "active", colorRole: "core", relatedIds: ["ai-recovered-context"] }),
  object({ id: "ai-recovered-context", kind: "planet", domain: "ai", label: "Contexto Recuperado", description: "Resumo de memórias usadas na resposta atual.", position: [3.9, 2.2, 0.4], orbitRadius: 2.15, orbitSpeed: 0.075, parentId: "ai", status: "active", colorRole: "memory", relatedIds: ["memory", "memory-notes"] }),
  object({ id: "ai-history", kind: "planet", domain: "ai", label: "Histórico", description: "Trocas recentes no console do operador.", position: [5.8, -0.1, 0.5], orbitRadius: 2.4, orbitSpeed: 0.065, parentId: "ai", status: "idle", colorRole: "core", relatedIds: ["memory-conversations"] }),

  object({ id: "kernel", kind: "system-component", domain: "system", label: "Kernel", description: "Versão, módulos, parâmetros e logs do kernel.", position: [-6.9, 2.9, 1.0], orbitRadius: 1.28, orbitSpeed: 0.12, parentId: "system", status: "idle", colorRole: "system", relatedIds: ["logs", "drivers"] }),
  object({ id: "systemd", kind: "system-component", domain: "system", label: "Systemd", description: "Serviços, unidades falhando e estado do boot atual.", position: [-5.9, 0.9, 2.4], orbitRadius: 1.6, orbitSpeed: 0.1, parentId: "system", status: "idle", colorRole: "system", relatedIds: ["services", "logs"] }),
  object({ id: "logs", kind: "planet", domain: "logs", label: "Logs", description: "Eventos recentes. Detalhes ficam em diagnóstico, não no painel principal.", position: [-3.9, 1.2, 2.8], orbitRadius: 1.9, orbitSpeed: 0.08, parentId: "system", status: "idle", colorRole: "system", relatedIds: ["kernel", "systemd"] }),
  object({ id: "services", kind: "system-component", domain: "system", label: "Serviços", description: "Unidades systemd relacionadas a ações e diagnósticos.", position: [-5.1, 3.1, 3.2], orbitRadius: 2.1, orbitSpeed: 0.075, parentId: "system", status: "idle", colorRole: "system", relatedIds: ["systemd"] }),
  object({ id: "packages", kind: "system-component", domain: "system", label: "Pacotes", description: "Pacman, Yay, updates e cache.", position: [-6.6, 1.6, -0.2], orbitRadius: 2.35, orbitSpeed: 0.07, parentId: "system", status: "idle", colorRole: "system", relatedIds: ["storage", "actions"] }),

  object({ id: "hyprland", kind: "planet", domain: "interface", label: "Hyprland", description: "Compositor Wayland e centro da sessão visual.", position: [-2.6, 5.1, 4.1], orbitRadius: 1.25, orbitSpeed: 0.11, parentId: "interface", status: "idle", colorRole: "system", relatedIds: ["gpu", "monitors"] }),
  object({ id: "monitors", kind: "planet", domain: "interface", label: "Monitores", description: "Monitores ativos e modos da sessão.", position: [-0.7, 4.8, 4.3], orbitRadius: 1.55, orbitSpeed: 0.095, parentId: "interface", status: "idle", colorRole: "system", relatedIds: ["hyprland"] }),
  object({ id: "workspaces", kind: "planet", domain: "interface", label: "Workspaces", description: "Espaços de trabalho e navegação.", position: [-1.4, 2.5, 4.7], orbitRadius: 1.9, orbitSpeed: 0.08, parentId: "interface", status: "idle", colorRole: "system", relatedIds: ["hyprland", "windows"] }),
  object({ id: "windows", kind: "planet", domain: "interface", label: "Janelas", description: "Clientes abertos no compositor.", position: [0.1, 3.6, 3.1], orbitRadius: 2.2, orbitSpeed: 0.07, parentId: "interface", status: "idle", colorRole: "system", relatedIds: ["workspaces"] }),
  object({ id: "quickshell", kind: "planet", domain: "interface", label: "Quickshell", description: "Shell End-4, QML e superfície visual.", position: [-2.7, 3.0, 2.4], orbitRadius: 2.45, orbitSpeed: 0.065, parentId: "interface", status: "idle", colorRole: "system", relatedIds: ["hyprland"] }),

  object({ id: "drivers", kind: "hardware-component", domain: "hardware", label: "Drivers", description: "Módulos e drivers de hardware.", position: [2.8, 4.1, -5.1], orbitRadius: 1.2, orbitSpeed: 0.1, parentId: "hardware", status: "idle", colorRole: "hardware", relatedIds: ["gpu", "kernel"] }),
  object({ id: "sensors", kind: "hardware-component", domain: "hardware", label: "Sensores", description: "Sensores disponíveis para leitura futura.", position: [1.4, 2.2, -4.9], orbitRadius: 1.55, orbitSpeed: 0.085, parentId: "hardware", status: "idle", colorRole: "hardware", relatedIds: ["cpu", "gpu"] }),
  object({ id: "memory-pressure", kind: "hardware-component", domain: "ram", label: "Pressão", description: "Pressão de memória e swap.", position: [2.5, -0.3, -6.2], orbitRadius: 1.1, orbitSpeed: 0.12, parentId: "ram-zram", status: "idle", colorRole: "hardware", relatedIds: ["zram"] }),
  object({ id: "zram", kind: "hardware-component", domain: "ram", label: "ZRAM", description: "Dispositivo de swap comprimido.", position: [4.6, -1.3, -5.8], orbitRadius: 1.4, orbitSpeed: 0.1, parentId: "ram-zram", status: "idle", colorRole: "hardware", relatedIds: ["memory-pressure"] }),
  object({ id: "disk", kind: "hardware-component", domain: "storage", label: "Disco", description: "Uso, blocos e filesystems.", position: [6.6, -3.0, 0.2], orbitRadius: 1.3, orbitSpeed: 0.1, parentId: "storage", status: "idle", colorRole: "hardware", relatedIds: ["memory-files", "packages"] }),

  object({ id: "network", kind: "planet", domain: "connectivity", label: "Rede", description: "NetworkManager, interfaces e conectividade.", position: [-5.6, -4.8, 2.0], orbitRadius: 1.2, orbitSpeed: 0.11, parentId: "connectivity", status: "idle", colorRole: "connectivity", relatedIds: ["dns"] }),
  object({ id: "bluetooth", kind: "planet", domain: "connectivity", label: "Bluetooth", description: "Controladores, rfkill e serviço Bluetooth.", position: [-3.1, -5.1, 3.9], orbitRadius: 1.55, orbitSpeed: 0.09, parentId: "connectivity", status: "idle", colorRole: "connectivity", relatedIds: ["services"] }),
  object({ id: "dns", kind: "planet", domain: "connectivity", label: "DNS", description: "Resolução de nomes e rotas.", position: [-3.2, -2.9, 3.8], orbitRadius: 1.85, orbitSpeed: 0.08, parentId: "connectivity", status: "idle", colorRole: "connectivity", relatedIds: ["network"] }),

  object({ id: "pipewire", kind: "planet", domain: "audio", label: "PipeWire", description: "Servidor de áudio e vídeo da sessão.", position: [2.5, -5.0, 4.0], orbitRadius: 1.2, orbitSpeed: 0.11, parentId: "audio", status: "idle", colorRole: "audio", relatedIds: ["wireplumber"] }),
  object({ id: "wireplumber", kind: "planet", domain: "audio", label: "WirePlumber", description: "Gerenciador de sessão do PipeWire.", position: [0.3, -5.5, 4.6], orbitRadius: 1.55, orbitSpeed: 0.09, parentId: "audio", status: "idle", colorRole: "audio", relatedIds: ["pipewire"] }),
  object({ id: "audio-devices", kind: "planet", domain: "audio", label: "Dispositivos", description: "Sinks, sources e dispositivos expostos.", position: [1.0, -3.0, 4.7], orbitRadius: 1.85, orbitSpeed: 0.08, parentId: "audio", status: "idle", colorRole: "audio", relatedIds: ["pipewire"] }),

  object({ id: "plans", kind: "action", domain: "actions", label: "Planos", description: "Planos gerados pela IA antes da aprovação.", position: [-1.5, -6.1, -1.8], orbitRadius: 1.2, orbitSpeed: 0.1, parentId: "actions", status: "approval", colorRole: "action", relatedIds: ["approvals"] }),
  object({ id: "approvals", kind: "action", domain: "actions", label: "Aprovações", description: "Camada obrigatória antes de qualquer execução.", position: [0.7, -6.0, -1.9], orbitRadius: 1.55, orbitSpeed: 0.085, parentId: "actions", status: "approval", colorRole: "action", relatedIds: ["approval-layer", "executions"] }),
  object({ id: "executions", kind: "action", domain: "actions", label: "Execuções", description: "Execuções reais após autorização.", position: [-0.4, -4.0, -2.7], orbitRadius: 1.85, orbitSpeed: 0.075, parentId: "actions", status: "idle", colorRole: "action", relatedIds: ["action-history"] }),
  object({ id: "action-history", kind: "action", domain: "actions", label: "Histórico", description: "Registro das ações planejadas, aprovadas ou canceladas.", position: [1.1, -4.8, 0.0], orbitRadius: 2.15, orbitSpeed: 0.065, parentId: "actions", status: "idle", colorRole: "action", relatedIds: ["memory-saved-actions"] }),
  object({ id: "approval-layer", kind: "action", domain: "actions", label: "Camada de Aprovação", description: "Nenhuma alteração real é executada sem autorização explícita.", position: [-1.7, -4.4, 0.3], orbitRadius: 2.45, orbitSpeed: 0.06, parentId: "actions", status: "approval", colorRole: "action", relatedIds: ["memory-rules"] }),
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
    const radius = 1.15 + ring * 0.34;
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
      position: [-4.8 + Math.cos(angle) * radius, -2.2 + Math.sin(index * 0.7) * 0.35, -2.4 + Math.sin(angle) * radius],
      orbitRadius: 0.8 + ring * 0.2,
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
