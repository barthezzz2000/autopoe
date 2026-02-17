export type Role = "steward" | "supervisor" | "worker";

export type AgentState =
  | "initializing"
  | "running"
  | "idle"
  | "error"
  | "terminated";

export type DisplayEventType =
  | "agent_created"
  | "agent_state_changed"
  | "agent_message"
  | "agent_terminated"
  | "tool_called";

export type UpdateEventType =
  | DisplayEventType
  | "history_entry_added"
  | "history_entry_delta";

export type EventType = UpdateEventType;

export interface TodoItem {
  id: number;
  text: string;
  done: boolean;
  type: string;
}

export interface Agent {
  id: string;
  role: Role;
  state: AgentState;
  children: string[];
  name: string | null;
  todos: TodoItem[];
}

export interface AgentEvent {
  type: EventType;
  agent_id: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  from: "human" | "steward";
  content: string;
  timestamp: number;
}

export type HistoryEntryType =
  | "SystemEntry"
  | "SystemInjection"
  | "ReceivedMessage"
  | "AssistantText"
  | "AssistantThinking"
  | "ToolCall"
  | "ErrorEntry";

export interface HistoryEntry {
  type: HistoryEntryType;
  content?: string | null;
  from_id?: string | null;
  tool_name?: string | null;
  tool_call_id?: string | null;
  arguments?: Record<string, unknown> | null;
  result?: string | null;
  timestamp: number;
  streaming?: boolean;
}

export interface AgentDetail {
  id: string;
  role: Role;
  state: AgentState;
  name: string | null;
  children: {
    id: string;
    role: Role;
    state: AgentState;
    name: string | null;
    todos: TodoItem[];
  }[];
  supervisor_id: string | null;
  todos: TodoItem[];
  history: HistoryEntry[];
}

export type StreamingDelta =
  | { type: "ContentDelta"; text: string }
  | { type: "ThinkingDelta"; text: string }
  | { type: "ToolResultDelta"; tool_call_id: string; text: string };
