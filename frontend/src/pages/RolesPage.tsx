import { useEffect, useState } from "react";
import { Check, Edit2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createRole, deleteRole, fetchRoles, updateRole } from "@/lib/api";
import type { Role } from "@/types";

type RoleDraft = Omit<Role, "id">;

const emptyDraft = (): RoleDraft => ({
  name: "",
  system_prompt: "",
});

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoleDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const refreshRoles = async () => {
    setLoading(true);
    try {
      const items = await fetchRoles();
      setRoles(items);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshRoles();
  }, []);

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const startEdit = (role: Role) => {
    setEditingId(role.id);
    setCreating(false);
    setDraft({ name: role.name, system_prompt: role.system_prompt });
  };

  const closeEditor = () => {
    setCreating(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const submit = async () => {
    if (!draft.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (!draft.system_prompt.trim()) {
      toast.error("System prompt is required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateRole(editingId, draft);
        setRoles((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        toast.success("Role updated");
      } else {
        const created = await createRole(draft.name, draft.system_prompt);
        setRoles((prev) => [created, ...prev]);
        toast.success("Role created");
      }
      closeEditor();
    } catch {
      toast.error("Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) {
        closeEditor();
      }
      toast.success("Role deleted");
    } catch {
      toast.error("Failed to delete role");
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Roles</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Define reusable agent behaviors with clear system prompts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void refreshRoles()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500"
          >
            <Plus className="size-3.5" />
            Add Role
          </button>
        </div>
      </div>

      {(creating || editingId) && (
        <section className="mb-5 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-200">
            {editingId ? "Edit Role" : "Create Role"}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
                placeholder="Planning Agent"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                System Prompt
              </label>
              <textarea
                value={draft.system_prompt}
                onChange={(e) =>
                  setDraft({ ...draft, system_prompt: e.target.value })
                }
                rows={10}
                className="w-full resize-y rounded border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-200"
                placeholder="You are a reliable assistant that..."
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="size-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={closeEditor}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="size-3.5" />
              Cancel
            </button>
          </div>
        </section>
      )}

      <div className="space-y-3 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Loading roles...
          </p>
        ) : roles.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No roles configured. Add one to use when spawning agents.
          </p>
        ) : (
          roles.map((role) => (
            <article
              key={role.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-medium text-zinc-100">
                    {role.name}
                  </h2>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap font-mono text-xs text-zinc-400">
                    {role.system_prompt}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(role)}
                    className="flex size-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => void remove(role.id)}
                    className="flex size-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[10px] font-mono text-zinc-600">
                {role.id}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
