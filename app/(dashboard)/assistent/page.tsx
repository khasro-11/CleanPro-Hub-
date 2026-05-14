import { AgentChat } from "@/components/agent/AgentChat";

export const metadata = { title: "KI-Assistent – CleanPro Hub" };

export default function AssistentPage() {
  return (
    <div className="-m-4 lg:-m-6 flex h-[calc(100dvh-3.5rem)] flex-col">
      <AgentChat className="flex-1 overflow-hidden" />
    </div>
  );
}
