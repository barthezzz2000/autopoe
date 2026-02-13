import { useAgent } from "@/context/AgentContext";
import { Button } from "@/components/ui/button";

export function PathAccessDialog() {
  const { pendingPathAccess, resolvePathAccess } = useAgent();

  if (pendingPathAccess.length === 0) return null;

  const request = pendingPathAccess[0];

  const handleResolve = (approved: boolean) => {
    resolvePathAccess(request.requestId, approved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Path Access Request
        </h2>
        <div className="mb-4 space-y-2 text-sm text-zinc-300">
          <div>
            <span className="font-medium text-zinc-400">Path: </span>
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">
              {request.path}
            </code>
          </div>
          <div>
            <span className="font-medium text-zinc-400">Reason: </span>
            {request.reason}
          </div>
          <div>
            <span className="font-medium text-zinc-400">Agent: </span>
            <code className="text-zinc-400">{request.agentId.slice(0, 8)}</code>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResolve(false)}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            Deny
          </Button>
          <Button
            size="sm"
            onClick={() => handleResolve(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
