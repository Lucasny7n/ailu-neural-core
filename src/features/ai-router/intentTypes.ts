export type OperatorIntent =
  | "conversation"
  | "question"
  | "explain"
  | "safe-diagnostic"
  | "system-action"
  | "app-navigation"
  | "app-feedback"
  | "settings-change"
  | "unknown";

export type ResponseMode = "answer" | "diagnostic" | "action-plan" | "navigate" | "feedback";

export interface IntentResult {
  intent: OperatorIntent;
  confidence: number;
  summary: string;
  targetNodes: string[];
  requiresApproval: boolean;
  shouldRunDiagnostics: boolean;
  shouldCreateActionPlan: boolean;
  responseMode: ResponseMode;
}

export type ConversationSuggestionKind = "navigate" | "diagnostic" | "action-plan";

export interface ConversationSuggestion {
  id: string;
  label: string;
  kind: ConversationSuggestionKind;
  nodeId?: string;
  diagnosticKey?: string;
  prompt?: string;
}

export interface ConversationResponse {
  title: string;
  body: string;
  suggestions: ConversationSuggestion[];
}
