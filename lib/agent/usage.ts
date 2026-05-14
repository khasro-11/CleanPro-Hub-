import { prisma } from "@/lib/db/client";

export async function logAgentUsage(params: {
  userId: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}) {
  await prisma.agentUsage.create({ data: params });
}
