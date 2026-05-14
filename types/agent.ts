export type ToolCallStatus = "loading" | "done" | "error";

export type ToolCallState = {
  id: string;
  toolName: string;
  status: ToolCallStatus;
  result?: unknown;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ToolCallState[];
};

export type AgentSSEEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; toolCallId: string; toolName: string }
  | { type: "tool_result"; toolCallId: string; result: unknown }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number } }
  | { type: "error"; message: string };
