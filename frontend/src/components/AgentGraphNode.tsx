import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  nodeTypeIcon,
  stateColor,
  stateBorder,
  nodeTypeBorder,
} from "@/lib/constants";
import type { AgentState, NodeType } from "@/types";

interface AgentNodeData {
  node_type: NodeType;
  state: AgentState;
  shortId: string;
  name: string | null;
  selected: boolean;
  toolCall: string | null;
  [key: string]: unknown;
}

export function AgentGraphNode({ data }: NodeProps) {
  const { node_type, state, shortId, name, selected, toolCall } =
    data as unknown as AgentNodeData;
  const Icon = nodeTypeIcon[node_type];

  const isToolActive = !!toolCall;
  const isRunning = state === "running";

  const baseBorder = isToolActive
    ? "border-amber-500/80"
    : node_type === "steward" || node_type === "conductor"
      ? nodeTypeBorder[node_type]
      : stateBorder[state];

  const nodeColors = {
    steward: "from-indigo-500/20 to-violet-500/10",
    conductor: "from-violet-500/20 to-purple-500/10",
    agent: "from-slate-500/10 to-slate-600/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
      className={cn(
        "relative flex min-w-[200px] items-center gap-3 rounded-xl border-2 px-4 py-3",
        "bg-gradient-to-br shadow-2xl",
        nodeColors[node_type],
        baseBorder,
        selected
          ? "border-primary shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]"
          : "border-border/60 hover:border-border",
        isRunning && "shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]",
        state === "terminated" && "opacity-40 grayscale",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-3 !border-2 !border-card !bg-muted-foreground"
      />

      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          "bg-gradient-to-br shadow-inner",
          node_type === "steward"
            ? "from-indigo-500/30 to-indigo-600/20 text-indigo-300"
            : node_type === "conductor"
              ? "from-violet-500/30 to-violet-600/20 text-violet-300"
              : "from-slate-500/20 to-slate-600/10 text-slate-400",
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {name ?? <span className="capitalize">{node_type}</span>}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {shortId}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="relative flex size-3">
          {(isRunning || isToolActive) && (
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-40",
                isToolActive ? "bg-amber-400" : stateColor[state],
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex size-3 rounded-full border-2 border-card shadow-sm",
              isToolActive ? "bg-amber-500" : stateColor[state],
            )}
          />
        </span>
      </div>

      {isToolActive && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap"
        >
          <span className="rounded-md border border-amber-500/30 bg-amber-950/80 px-2 py-1 text-[10px] font-mono text-amber-300 shadow-lg backdrop-blur-sm">
            ⚡ {toolCall}
          </span>
        </motion.div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-3 !border-2 !border-card !bg-muted-foreground"
      />
    </motion.div>
  );
}
