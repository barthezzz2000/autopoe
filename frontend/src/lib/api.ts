import type { Agent, AgentDetail } from "@/types";

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  const data = await res.json();
  return data.agents ?? [];
}

export async function fetchAgentDetail(
  agentId: string,
): Promise<AgentDetail | null> {
  const res = await fetch(`/api/agents/${agentId}`);
  const data = await res.json();
  if (data.error || !Array.isArray(data.history)) return null;
  return data as AgentDetail;
}

export async function sendAgentMessage(
  agentId: string,
  message: string,
): Promise<void> {
  await fetch(`/api/agents/${agentId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function terminateAgent(agentId: string): Promise<void> {
  await fetch(`/api/agents/${agentId}/terminate`, { method: "POST" });
}

export async function createSteward(params: {
  repo_path: string;
  name?: string;
  branch?: string;
  commit?: string;
}): Promise<{ id: string; name: string; repo_path: string }> {
  const res = await fetch("/api/stewards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function listStewards(): Promise<
  { id: string; name: string; repo_path: string; state: string }[]
> {
  const res = await fetch("/api/stewards");
  const data = await res.json();
  return data.stewards ?? [];
}

export async function mergeToMain(
  agentId: string,
): Promise<{ status: string; message?: string }> {
  const res = await fetch(`/api/agents/${agentId}/merge-to-main`, {
    method: "POST",
  });
  return res.json();
}

export async function listBranches(repo: string): Promise<string[]> {
  const res = await fetch(`/api/git/branches?repo=${encodeURIComponent(repo)}`);
  const data = await res.json();
  return data.branches ?? [];
}

export async function listCommits(
  repo: string,
  branch: string = "main",
): Promise<{ sha: string; message: string; author: string; date: string }[]> {
  const res = await fetch(
    `/api/git/commits?repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`,
  );
  const data = await res.json();
  return data.commits ?? [];
}
