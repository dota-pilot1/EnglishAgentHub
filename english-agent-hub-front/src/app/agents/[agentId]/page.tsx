import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AgentChatClient } from "./AgentChatClient";

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
