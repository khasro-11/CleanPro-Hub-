"use client";

import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";
import type { ChatMessage, ToolCallState } from "@/types/agent";
import { cn } from "@/lib/utils";

interface Props {
  messages: ChatMessage[];
  streamingContent: string;
  streamingToolCalls: ToolCallState[];
  isStreaming: boolean;
}

export function MessageList({ messages, streamingContent, streamingToolCalls, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, streamingToolCalls]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40">
          <Bot className="h-6 w-6 text-brand-500" />
        </div>
        <p className="text-sm font-medium text-foreground">KI-Assistent</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ich helfe dir bei Kunden, Mitarbeitern und Aufträgen. Frag mich einfach!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isStreaming && (streamingContent || streamingToolCalls.length > 0) && (
        <div className="flex gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
            <Bot className="h-4 w-4 text-brand-500" />
          </div>
          <div className="min-w-0 flex-1">
            {streamingToolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
            {streamingContent && (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block h-4 w-0.5 animate-pulse bg-brand-400 align-text-bottom ml-0.5" />
              </p>
            )}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-brand-500/20"
            : "bg-brand-500/10"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-brand-500" />
        ) : (
          <Bot className="h-4 w-4 text-brand-500" />
        )}
      </div>

      <div className={cn("min-w-0 max-w-[85%]", isUser && "items-end flex flex-col")}>
        {message.toolCalls.map((tc) => (
          <ToolCallCard key={tc.id} toolCall={tc} />
        ))}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              isUser
                ? "rounded-tr-sm bg-brand-500 text-white"
                : "rounded-tl-sm bg-muted/60 text-foreground"
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}
