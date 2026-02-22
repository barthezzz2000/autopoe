import {
  BookOpen,
  Bot,
  Moon,
  Network,
  Server,
  Settings,
  Sparkles,
  Sun,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgent, type PageId } from "@/context/AgentContext";
import { useTheme } from "@/context/ThemeContext";

const NAV_ITEMS: Array<{ id: PageId; icon: typeof Network; label: string }> = [
  { id: "graph", icon: Network, label: "Workspace" },
  { id: "providers", icon: Server, label: "Providers" },
  { id: "roles", icon: BookOpen, label: "Roles" },
  { id: "tools", icon: Wrench, label: "Tools" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, connected, agents } = useAgent();
  const { theme, toggleTheme } = useTheme();

  const runningCount = Array.from(agents.values()).filter(
    (agent) => agent.state === "running",
  ).length;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col p-2.5">
      <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 p-3 shadow-xl">
        <div className="mb-3 rounded-xl border border-border/40 bg-card/60 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary/70">
                Autopoe
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight">
                Agent Studio
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className="flex size-8 items-center justify-center rounded-lg border border-border/50 bg-card/50 text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
              title={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              {theme === "light" ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "size-2 rounded-full",
                connected ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            <span>{connected ? "Connected" : "Reconnecting"}</span>
          </div>
        </div>

        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
          Workspace
        </div>

        <nav className="flex-1 space-y-1 px-1">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                currentPage === id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  currentPage === id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground group-hover:text-accent-foreground",
                )}
              />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-3 rounded-xl border border-border/40 bg-card/60 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold">Live Agents</p>
              <p className="text-[11px] text-muted-foreground">
                {agents.size} total · {runningCount} running
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/50 px-2.5 py-2 text-[11px] text-accent-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Click a node to view details</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
