import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { runAgentStream, type IncomingMessage } from "@/lib/agent/runner";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(50),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = (session.user as { id: string }).id;
    const isAdmin = (session.user as { role: string }).role === "ADMIN";

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Ungültige Eingabe", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const { messages, sessionId } = parsed.data;
    const resolvedSessionId = sessionId ?? randomUUID();

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    runAgentStream({
      messages: messages as IncomingMessage[],
      userId,
      sessionId: resolvedSessionId,
      isAdmin,
      writer,
    }).catch((err) => {
      logger.error("Agent stream error", { err: String(err) });
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Session-Id": resolvedSessionId,
      },
    });
  } catch (err) {
    logger.error("Agent route error", { err: String(err) });
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Interner Fehler" } },
      { status: 500 }
    );
  }
}
