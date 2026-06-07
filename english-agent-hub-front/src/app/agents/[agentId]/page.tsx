import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AgentChatClient } from "./AgentChatClient";

const STATIC_AGENT_IDS = ["debate", "roleplay", "quiz"];

export function generateStaticParams() {
  return STATIC_AGENT_IDS.map((agentId) => ({ agentId }));
}

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;

  return (
    <RequireAuth>
      <AgentChatClient agentId={agentId} />
    </RequireAuth>
  );
}
