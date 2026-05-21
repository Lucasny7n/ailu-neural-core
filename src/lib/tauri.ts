import { invoke, type InvokeArgs } from "@tauri-apps/api/core";

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
};

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in (window as TauriWindow);
}

export async function safeInvoke<T>(command: string, args?: InvokeArgs): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error("Runtime Tauri indisponivel nesta sessao.");
  }
  return invoke<T>(command, args);
}
