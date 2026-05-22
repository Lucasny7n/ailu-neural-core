import type { AppConfig } from "../config/configTypes";
import type { ActionIntent, PlannedCommand, RiskLevel, SystemActionPlan } from "./aiTypes";
import { createId } from "./structuredActionParser";

interface FallbackPlanInput {
  title: string;
  description: string;
  intent: ActionIntent;
  riskLevel: RiskLevel;
  riskSummary: string;
  commands: Omit<PlannedCommand, "id">[];
  affectedFiles?: string[];
  affectedPackages?: string[];
  affectedServices?: string[];
  targetNodes: string[];
}

export function createFallbackPlan(userRequest: string, config: AppConfig): SystemActionPlan {
  const normalized = userRequest.toLowerCase();

  if (normalized.includes("bluetooth")) {
    return buildPlan(userRequest, config, {
      title: "Diagnosticar Bluetooth",
      description: "Coleta estado do controlador, bloqueios rfkill e unidades relacionadas.",
      intent: "diagnose",
      riskLevel: "low",
      riskSummary: "Somente leitura; não altera adaptadores nem serviços.",
      targetNodes: ["bluetooth", "bt-rfkill", "bt-controller", "systemd"],
      affectedServices: ["bluetooth.service"],
      commands: [
        cmd("bluetoothctl show", "Verifica controlador Bluetooth.", 10_000),
        cmd("bluetoothctl list", "Lista controladores detectados.", 10_000),
        cmd("rfkill list", "Procura bloqueios de radio.", 10_000),
        cmd("systemctl status bluetooth --no-pager", "Confere estado do serviço Bluetooth.", 10_000),
      ],
    });
  }

  if (normalized.includes("kernel") || normalized.includes("journal")) {
    return buildPlan(userRequest, config, {
      title: "Ler erros do kernel",
      description: "Coleta erros recentes e journal do kernel no boot atual.",
      intent: "query",
      riskLevel: "low",
      riskSummary: "Somente leitura de logs locais.",
      targetNodes: ["kernel", "logs", "kernel-logs", "journal-errors"],
      commands: [
        cmd("uname -a", "Identifica kernel ativo.", 8_000),
        cmd("journalctl -p 3 -xb --no-pager -n 80", "Lista erros de alta prioridade.", 15_000),
        cmd("journalctl -k --no-pager -n 80", "Lista eventos recentes do kernel.", 15_000),
      ],
    });
  }

  if (normalized.includes("servi") && normalized.includes("falh")) {
    return buildPlan(userRequest, config, {
      title: "Verificar serviços falhando",
      description: "Consulta unidades systemd em falha.",
      intent: "diagnose",
      riskLevel: "low",
      riskSummary: "Somente leitura do systemd.",
      targetNodes: ["systemd", "failed-units"],
      commands: [
        cmd("systemctl --failed", "Lista unidades falhando.", 10_000),
        cmd("journalctl -p 3 -xb --no-pager -n 80", "Coleta erros recentes do boot.", 15_000),
      ],
    });
  }

  if (normalized.includes("ollama")) {
    return buildPlan(userRequest, config, {
      title: "Verificar Ollama local",
      description: "Consulta modelos instalados e estado do serviço local.",
      intent: "diagnose",
      riskLevel: "low",
      riskSummary: "Somente leitura; nao baixa modelos.",
      targetNodes: ["ollama", "local-models", "qwen-coder"],
      affectedServices: ["ollama.service"],
      commands: [
        cmd("ollama list", "Lista modelos locais instalados.", 15_000),
        cmd("systemctl status ollama --no-pager", "Confere serviço Ollama se existir.", 10_000),
      ],
    });
  }

  if (normalized.includes("ram") || normalized.includes("zram") || normalized.includes("memoria")) {
    return buildPlan(userRequest, config, {
      title: "Diagnosticar RAM e ZRAM",
      description: "Coleta uso de memória, swap e dispositivos zram.",
      intent: "diagnose",
      riskLevel: "low",
      riskSummary: "Somente leitura de memória e swap.",
      targetNodes: ["ram-zram", "swapon", "zramctl"],
      commands: [
        cmd("free -h", "Resume memória usada e total.", 8_000),
        cmd("swapon --show", "Mostra swap ativo.", 8_000),
        cmd("zramctl", "Mostra dispositivos zram.", 8_000),
      ],
    });
  }

  if (normalized.includes("hyprland")) {
    return buildPlan(userRequest, config, {
      title: "Diagnosticar Hyprland",
      description: "Consulta versao, monitores, workspaces e clients.",
      intent: "diagnose",
      riskLevel: "low",
      riskSummary: "Somente leitura via hyprctl.",
      targetNodes: ["hyprland", "monitors", "workspaces", "clients"],
      commands: [
        cmd("hyprctl version", "Mostra versao do Hyprland.", 8_000),
        cmd("hyprctl monitors", "Lista monitores.", 8_000),
        cmd("hyprctl workspaces", "Lista workspaces.", 8_000),
        cmd("hyprctl clients", "Lista clients.", 8_000),
      ],
    });
  }

  if (normalized.includes("steam") && (normalized.includes("remove") || normalized.includes("remo") || normalized.includes("apaga") || normalized.includes("apagar"))) {
    return buildPlan(userRequest, config, {
      title: "Preparar remoção do Steam",
      description: "Mapeia pacotes e dados antes de qualquer remoção real.",
      intent: "remove",
      riskLevel: "high",
      riskSummary: "Remover Steam pode afetar bibliotecas e dados; este plano inicial apenas diagnostica.",
      targetNodes: ["packages", "actions"],
      affectedPackages: ["steam"],
      affectedFiles: ["~/.steam", "~/.local/share/Steam"],
      commands: [
        cmd("pacman -Qs steam", "Lista pacotes Steam instalados.", 10_000),
        cmd("du -sh ~/.steam ~/.local/share/Steam 2>/dev/null || true", "Estima tamanho dos dados locais.", 15_000),
        cmd("printf '%s\\n' 'Edite este plano para adicionar remoção real após revisar bibliotecas e saves.'", "Marca etapa manual obrigatória.", 5_000),
      ],
    });
  }

  if (normalized.includes("hydra")) {
    return buildPlan(userRequest, config, {
      title: "Preparar instalação do Hydra Launcher",
      description: "Consulta disponibilidade antes de qualquer instalação.",
      intent: "install",
      riskLevel: "medium",
      riskSummary: "Instalação de pacotes muda o sistema; este plano inicial apenas consulta.",
      targetNodes: ["packages", "actions"],
      affectedPackages: ["hydra-launcher"],
      commands: [
        cmd("pacman -Ss hydra | head -80", "Procura pacote nos repositorios oficiais.", 12_000),
        cmd("yay -Ss hydra-launcher | head -80", "Procura pacote no AUR se yay existir.", 15_000),
      ],
    });
  }

  if (normalized.includes("pipewire") && (normalized.includes("reinicia") || normalized.includes("restart"))) {
    return buildPlan(userRequest, config, {
      title: "Reiniciar PipeWire",
      description: "Prepara restart do stack de audio do usuario.",
      intent: "restart-service",
      riskLevel: "medium",
      riskSummary: "Pode interromper audio da sessao por alguns segundos.",
      targetNodes: ["audio", "pipewire", "wireplumber"],
      affectedServices: ["pipewire.service", "pipewire-pulse.service", "wireplumber.service"],
      commands: [
        cmd("systemctl --user status pipewire pipewire-pulse wireplumber --no-pager", "Coleta estado antes do restart.", 10_000),
        cmd("systemctl --user restart pipewire pipewire-pulse wireplumber", "Reinicia serviços de áudio do usuário.", 20_000),
        cmd("wpctl status", "Valida grafo de audio apos restart.", 10_000),
      ],
    });
  }

  if (normalized.includes("pacman") && normalized.includes("cache")) {
    return buildPlan(userRequest, config, {
      title: "Analisar cache do pacman",
      description: "Prepara limpeza com etapa seca antes da remoção real.",
      intent: "optimize",
      riskLevel: "medium",
      riskSummary: "Limpeza real remove cache de pacotes; comando inicial usa dry-run.",
      targetNodes: ["packages", "pacman-cache"],
      commands: [
        cmd("du -sh /var/cache/pacman/pkg 2>/dev/null || true", "Mostra tamanho do cache.", 10_000),
        cmd("paccache -dk2", "Simula limpeza mantendo duas versoes.", 15_000),
      ],
    });
  }

  if (normalized.includes("backup")) {
    return buildPlan(userRequest, config, {
      title: "Preparar backup do projeto",
      description: "Identifica diretorio atual e prepara comando editavel de backup.",
      intent: "backup",
      riskLevel: "medium",
      riskSummary: "Backup pode consumir disco; revise origem e destino antes de executar.",
      targetNodes: ["disk", "actions", "memory"],
      commands: [
        cmd("pwd", "Confirma diretorio atual do executor.", 5_000),
        cmd("printf '%s\\n' 'Defina origem/destino antes de rodar tar ou rsync.'", "Exige edicao explicita do comando real.", 5_000),
      ],
    });
  }

  return buildPlan(userRequest, config, {
    title: "Plano de diagnóstico seguro",
    description: "Coleta informacoes gerais sem alterar o sistema.",
    intent: "diagnose",
    riskLevel: "low",
    riskSummary: "Somente leitura.",
    targetNodes: ["core", "systemd", "logs"],
    commands: [
      cmd("uname -a", "Identifica kernel e arquitetura.", 8_000),
      cmd("uptime", "Mostra uptime e load.", 8_000),
      cmd("systemctl --failed", "Lista falhas systemd.", 10_000),
    ],
  });
}

function buildPlan(userRequest: string, config: AppConfig, input: FallbackPlanInput): SystemActionPlan {
  return {
    id: createId("plan"),
    userRequest,
    title: input.title,
    description: input.description,
    intent: input.intent,
    riskLevel: input.riskLevel,
    riskSummary: input.riskSummary,
    commands: input.commands.map((command) => ({ ...command, id: createId("cmd") })),
    affectedFiles: input.affectedFiles ?? [],
    affectedPackages: input.affectedPackages ?? [],
    affectedServices: input.affectedServices ?? [],
    targetNodes: input.targetNodes,
    requiresConfirmation: true,
    model: config.defaultModel,
    provider: config.aiProviderType,
    createdAt: new Date().toISOString(),
  };
}

function cmd(
  command: string,
  description: string,
  timeoutMs: number,
  options?: Pick<PlannedCommand, "requiresSudo" | "destructive" | "cwd">,
): Omit<PlannedCommand, "id"> {
  return {
    command,
    description,
    timeoutMs,
    requiresSudo: options?.requiresSudo ?? false,
    destructive: options?.destructive ?? false,
    cwd: options?.cwd,
  };
}
