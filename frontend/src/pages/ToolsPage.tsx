import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";

interface ToolInfo {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export function ToolsPage() {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data) => setTools(data.tools ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q),
    );
  }, [query, tools]);

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-100">Built-in Tools</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Explore available tools and their JSON schemas before assigning them
          to agents.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
        <Search className="size-4 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by tool name or description"
          className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
        />
        <span className="text-xs text-zinc-500">{filteredTools.length}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto">
          {filteredTools.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No matching tools.
            </p>
          )}

          {filteredTools.map((tool) => {
            const isExpanded = expanded.has(tool.name);
            return (
              <article
                key={tool.name}
                className="rounded-lg border border-zinc-800 bg-zinc-900"
              >
                <button
                  onClick={() => toggle(tool.name)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="mt-0.5 size-4 text-zinc-500" />
                  ) : (
                    <ChevronRight className="mt-0.5 size-4 text-zinc-500" />
                  )}

                  <code className="shrink-0 rounded border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs font-mono text-amber-400">
                    {tool.name}
                  </code>

                  <p className="text-sm text-zinc-400">{tool.description}</p>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 py-3">
                    <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                      Parameters
                    </p>
                    <pre className="max-h-64 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-300">
                      {JSON.stringify(tool.parameters ?? {}, null, 2)}
                    </pre>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
