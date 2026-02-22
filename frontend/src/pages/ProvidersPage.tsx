import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit2,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createProvider,
  deleteProvider,
  fetchProviders,
  updateProvider,
} from "@/lib/api";
import { providerTypeLabel, providerTypeOptions } from "@/lib/providerTypes";
import type { Provider } from "@/types";

type ProviderDraft = Omit<Provider, "id">;

const emptyDraft = (): ProviderDraft => ({
  name: "",
  type: "openai_compatible",
  base_url: "",
  api_key: "",
});

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<ProviderDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ProviderDraft>(emptyDraft());
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const editingProvider = useMemo(
    () => providers.find((p) => p.id === editingId) ?? null,
    [providers, editingId],
  );

  const refreshProviders = async () => {
    setLoading(true);
    try {
      const items = await fetchProviders();
      setProviders(items);
    } catch {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshProviders();
  }, []);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startCreate = () => {
    setCreating(true);
    setCreateDraft(emptyDraft());
  };

  const cancelCreate = () => {
    setCreating(false);
    setCreateDraft(emptyDraft());
  };

  const submitCreate = async () => {
    if (!createDraft.name.trim()) {
      toast.error("Provider name is required");
      return;
    }
    setSaving(true);
    try {
      const created = await createProvider(createDraft);
      setProviders((prev) => [created, ...prev]);
      setCreating(false);
      setCreateDraft(emptyDraft());
      toast.success("Provider created");
    } catch {
      toast.error("Failed to create provider");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (provider: Provider) => {
    setEditingId(provider.id);
    setEditDraft({
      name: provider.name,
      type: provider.type,
      base_url: provider.base_url,
      api_key: provider.api_key,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(emptyDraft());
  };

  const submitEdit = async () => {
    if (!editingId) return;
    if (!editDraft.name.trim()) {
      toast.error("Provider name is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProvider(editingId, editDraft);
      setProviders((prev) =>
        prev.map((p) => (p.id === editingId ? updated : p)),
      );
      setEditingId(null);
      setEditDraft(emptyDraft());
      toast.success("Provider updated");
    } catch {
      toast.error("Failed to update provider");
    } finally {
      setSaving(false);
    }
  };

  const removeProvider = async (id: string) => {
    try {
      await deleteProvider(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
      toast.success("Provider deleted");
    } catch {
      toast.error("Failed to delete provider");
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Providers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Add providers and update credentials directly from this page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refreshProviders()}
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
            Add Provider
          </button>
        </div>
      </div>

      {creating && (
        <ProviderEditor
          title="Create Provider"
          draft={createDraft}
          onDraftChange={setCreateDraft}
          onSave={() => void submitCreate()}
          onCancel={cancelCreate}
          saving={saving}
        />
      )}

      {editingProvider && (
        <ProviderEditor
          title={`Edit ${editingProvider.name}`}
          draft={editDraft}
          onDraftChange={setEditDraft}
          onSave={() => void submitEdit()}
          onCancel={cancelEdit}
          saving={saving}
        />
      )}

      <div className="space-y-3 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Loading providers...
          </p>
        ) : providers.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No providers configured. Add one to get started.
          </p>
        ) : (
          providers.map((provider) => (
            <article
              key={provider.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="truncate text-sm font-medium text-zinc-100">
                      {provider.name}
                    </h2>
                    <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                      {providerTypeLabel(provider.type)}
                    </span>
                  </div>

                  <p className="truncate text-xs text-zinc-500">
                    {provider.base_url}
                  </p>

                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs font-mono text-zinc-500">
                      {provider.api_key
                        ? showKeys.has(provider.id)
                          ? provider.api_key
                          : `••••••••${provider.api_key.slice(-4)}`
                        : "No API key"}
                    </span>
                    {provider.api_key && (
                      <button
                        onClick={() => toggleShowKey(provider.id)}
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      >
                        {showKeys.has(provider.id) ? (
                          <EyeOff className="size-3" />
                        ) : (
                          <Eye className="size-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(provider)}
                    className="flex size-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => void removeProvider(provider.id)}
                    className="flex size-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-[10px] font-mono text-zinc-600">
                {provider.id}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function ProviderEditor({
  title,
  draft,
  onDraftChange,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  draft: ProviderDraft;
  onDraftChange: (next: ProviderDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <section className="mb-5 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
      <h2 className="mb-3 text-sm font-medium text-zinc-200">{title}</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Name</label>
          <input
            value={draft.name}
            onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            placeholder="My Provider"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Type</label>
          <select
            value={draft.type}
            onChange={(e) => onDraftChange({ ...draft, type: e.target.value })}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
          >
            {providerTypeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-zinc-400">Base URL</label>
          <input
            value={draft.base_url}
            onChange={(e) =>
              onDraftChange({ ...draft, base_url: e.target.value })
            }
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-zinc-400">API Key</label>
          <input
            type="password"
            value={draft.api_key}
            onChange={(e) =>
              onDraftChange({ ...draft, api_key: e.target.value })
            }
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200"
            placeholder="sk-..."
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check className="size-3.5" />
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="size-3.5" />
          Cancel
        </button>
      </div>
    </section>
  );
}
