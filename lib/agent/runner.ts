import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./system-prompt";
import { AGENT_TOOLS } from "./tools";
import { logAgentUsage } from "./usage";
import {
  handleListCustomers,
  handleCreateCustomer,
  handleUpdateCustomer,
  handleListEmployees,
  handleCreateEmployee,
  handleScheduleJob,
  handleGetEmployeeHours,
  handleGenerateMonthlyReport,
  handleFindAvailableEmployee,
  type ToolResult,
} from "./tool-handlers";

export type AgentSSEEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; toolCallId: string; toolName: string }
  | { type: "tool_result"; toolCallId: string; result: ToolResult }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number } }
  | { type: "error"; message: string };

export type ChatRole = "user" | "assistant";
export type IncomingMessage = { role: ChatRole; content: string };

const ADMIN_ONLY_TOOLS = new Set([
  "createCustomer",
  "updateCustomer",
  "createEmployee",
  "scheduleJob",
]);

const MODEL = "claude-sonnet-4-5";

async function executeTool(name: string, input: unknown): Promise<ToolResult> {
  const i = input as Record<string, unknown>;
  switch (name) {
    case "listCustomers":
      return handleListCustomers(i as Parameters<typeof handleListCustomers>[0]);
    case "createCustomer":
      return handleCreateCustomer(i as Parameters<typeof handleCreateCustomer>[0]);
    case "updateCustomer":
      return handleUpdateCustomer(i as Parameters<typeof handleUpdateCustomer>[0]);
    case "listEmployees":
      return handleListEmployees(i as Parameters<typeof handleListEmployees>[0]);
    case "createEmployee":
      return handleCreateEmployee(i as Parameters<typeof handleCreateEmployee>[0]);
    case "scheduleJob":
      return handleScheduleJob(i as Parameters<typeof handleScheduleJob>[0]);
    case "getEmployeeHours":
      return handleGetEmployeeHours(i as Parameters<typeof handleGetEmployeeHours>[0]);
    case "generateMonthlyReport":
      return handleGenerateMonthlyReport(i as Parameters<typeof handleGenerateMonthlyReport>[0]);
    case "findAvailableEmployee":
      return handleFindAvailableEmployee(i as Parameters<typeof handleFindAvailableEmployee>[0]);
    default:
      return { ok: false, error: `Unbekanntes Tool: ${name}` };
  }
}

export async function runAgentStream(params: {
  messages: IncomingMessage[];
  userId: string;
  sessionId: string;
  isAdmin: boolean;
  writer: WritableStreamDefaultWriter<Uint8Array>;
}) {
  const { messages, userId, sessionId, isAdmin, writer } = params;
  const encoder = new TextEncoder();

  function send(event: AgentSSEEvent) {
    writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const availableTools = isAdmin
    ? AGENT_TOOLS
    : AGENT_TOOLS.filter((t) => !ADMIN_ONLY_TOOLS.has(t.name));

  const currentMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    while (true) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: currentMessages,
        tools: availableTools,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_start" &&
          event.content_block.type === "tool_use"
        ) {
          send({
            type: "tool_start",
            toolCallId: event.content_block.id,
            toolName: event.content_block.name,
          });
        } else if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          send({ type: "text", delta: event.delta.text });
        }
      }

      const finalMsg = await stream.finalMessage();
      totalInputTokens += finalMsg.usage.input_tokens;
      totalOutputTokens += finalMsg.usage.output_tokens;

      if (finalMsg.stop_reason === "tool_use") {
        currentMessages.push({ role: "assistant", content: finalMsg.content });

        const toolResultContent: Anthropic.ToolResultBlockParam[] = [];

        for (const block of finalMsg.content) {
          if (block.type !== "tool_use") continue;

          if (!isAdmin && ADMIN_ONLY_TOOLS.has(block.name)) {
            const denied: ToolResult = {
              ok: false,
              error: "Keine Berechtigung für diese Aktion. Nur Admins dürfen das ausführen.",
            };
            send({ type: "tool_result", toolCallId: block.id, result: denied });
            toolResultContent.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(denied),
              is_error: true,
            });
            continue;
          }

          const result = await executeTool(block.name, block.input);
          send({ type: "tool_result", toolCallId: block.id, result });
          toolResultContent.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
            is_error: !result.ok,
          });
        }

        currentMessages.push({ role: "user", content: toolResultContent });
      } else {
        send({ type: "done", usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } });
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    send({ type: "error", message });
  } finally {
    await logAgentUsage({
      userId,
      sessionId,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      model: MODEL,
    }).catch(() => {});
    writer.close();
  }
}
