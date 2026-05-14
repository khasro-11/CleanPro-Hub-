"use client";

import { useState, useCallback, useRef, useId } from "react";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { ChatMessage, ToolCallState, AgentSSEEvent } from "@/types/agent";
import { randomId, cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function AgentChat({ className }: Props) {
  const sessionId = useId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCallState[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMessage: ChatMessage = {
      id: randomId(),
      role: "user",
      content: text,
      toolCalls: [],
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    setStreamingToolCalls([]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          sessionId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Verbindungsfehler");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accContent = "";
      let accToolCalls: ToolCallState[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: AgentSSEEvent;
          try {
            event = JSON.parse(raw) as AgentSSEEvent;
          } catch {
            continue;
          }

          if (event.type === "text") {
            accContent += event.delta;
            setStreamingContent(accContent);
          } else if (event.type === "tool_start") {
            const tc: ToolCallState = {
              id: event.toolCallId,
              toolName: event.toolName,
              status: "loading",
            };
            accToolCalls = [...accToolCalls, tc];
            setStreamingToolCalls([...accToolCalls]);
          } else if (event.type === "tool_result") {
            const r = event.result as { ok: boolean };
            accToolCalls = accToolCalls.map((tc) =>
              tc.id === event.toolCallId
                ? { ...tc, status: r.ok ? "done" : "error", result: event.result }
                : tc
            );
            setStreamingToolCalls([...accToolCalls]);
          } else if (event.type === "done") {
            const assistantMessage: ChatMessage = {
              id: randomId(),
              role: "assistant",
              content: accContent,
              toolCalls: accToolCalls,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent("");
            setStreamingToolCalls([]);
            setIsStreaming(false);
          } else if (event.type === "error") {
            toast.error(`Fehler: ${event.message}`);
            setIsStreaming(false);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Verbindung zum Assistenten unterbrochen.");
      setIsStreaming(false);
      setStreamingContent("");
      setStreamingToolCalls([]);
    }
  }, [input, isStreaming, messages, sessionId]);

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-brand-950 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20">
          <Bot className="h-5 w-5 text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">KI-Assistent</p>
          <p className="text-xs text-brand-400/60">CleanPro Reinigungsservice</p>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        streamingToolCalls={streamingToolCalls}
        isStreaming={isStreaming}
      />

      {/* Input */}
      <MessageInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        disabled={isStreaming}
      />
    </div>
  );
}
