import "@/styles/App.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Group, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { AgentProvider } from "@/context/AgentContext";
import { AgentTree } from "@/components/AgentTree";
import { EventLog } from "@/components/EventLog";
import { PathAccessDialog } from "@/components/PathAccessDialog";

function App() {
  return (
    <AgentProvider>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-screen bg-zinc-950 text-zinc-100">
          <Group orientation="horizontal">
            <Panel defaultSize={75} minSize={40}>
              <AgentTree />
            </Panel>
            <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-zinc-600 transition-colors" />
            <Panel defaultSize={25} minSize={15}>
              <EventLog />
            </Panel>
          </Group>
        </div>
        <PathAccessDialog />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            className: "bg-zinc-900 border-zinc-800 text-zinc-100",
          }}
        />
      </TooltipProvider>
    </AgentProvider>
  );
}

export default App;
