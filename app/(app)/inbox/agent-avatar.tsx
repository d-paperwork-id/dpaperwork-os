const AGENT_INITIALS: Record<string, string> = {
  "chief-of-staff": "CS",
  pm: "PM",
  "executive-assistant": "EA",
};

export function AgentAvatar({ agentId }: { agentId: string }) {
  const initial = AGENT_INITIALS[agentId] ?? agentId.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
      style={{ backgroundColor: `var(--agent-${agentId})` }}
    >
      {initial}
    </div>
  );
}
