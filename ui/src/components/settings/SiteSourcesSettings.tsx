import { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, ExternalLink, RotateCcw } from 'lucide-react';
import {
  type AiSiteSource,
  loadSiteSources,
  saveSiteSources,
  addCustomSiteSource,
  updateSiteSource,
  deleteSiteSource,
  DEFAULT_SITE_SOURCES,
} from '@/lib/siteSources';

export function SiteSourcesSettings() {
  const [sources, setSources] = useState<AiSiteSource[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState('#38BDF8');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSources(loadSiteSources());
  }, []);

  function handleToggle(id: string, currentEnabled: boolean) {
    const updated = updateSiteSource(sources, id, { enabled: !currentEnabled });
    setSources(updated);
    saveSiteSources(updated);
  }

  function handleAdd() {
    try {
      setError(null);
      const currentList = [...sources];
      addCustomSiteSource(currentList, { name, url, color, notes });
      setSources(currentList);
      saveSiteSources(currentList);
      setName('');
      setUrl('');
      setNotes('');
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add source');
    }
  }

  function handleDelete(id: string) {
    try {
      const updated = deleteSiteSource(sources, id);
      setSources(updated);
      saveSiteSources(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete source');
    }
  }

  function handleReset() {
    setSources([...DEFAULT_SITE_SOURCES]);
    saveSiteSources([...DEFAULT_SITE_SOURCES]);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">AI Site Sources</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Configure preset and custom AI website sources for your workspace viewports.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            title="Reset to defaults"
            className="flex items-center gap-1.5 rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:bg-[rgb(var(--ink-rgb)/0.06)] hover:text-[var(--text)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Custom Source</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="rounded-xl border border-[rgb(var(--ink-rgb)/0.15)] bg-[rgb(var(--surface-rgb)/0.5)] p-4 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            New AI Site Source
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Source Name</label>
              <input
                type="text"
                placeholder="e.g. Open WebUI / Qwen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.04)] px-3 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Website URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.04)] px-3 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Theme Color</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-[rgb(var(--ink-rgb)/0.12)] bg-transparent p-0.5"
                />
                <span className="text-xs font-mono text-[var(--muted)]">{color}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted)]">Notes (Optional)</label>
              <input
                type="text"
                placeholder="Description or shortcut info"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[rgb(var(--ink-rgb)/0.12)] bg-[rgb(var(--ink-rgb)/0.04)] px-3 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[rgb(var(--ink-rgb)/0.06)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Save Source
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y divide-[rgb(var(--ink-rgb)/0.08)] rounded-xl border border-[rgb(var(--ink-rgb)/0.1)]">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between p-3.5 hover:bg-[rgb(var(--ink-rgb)/0.02)]"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: source.color }}
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{source.name}</span>
                  {source.isCustom && (
                    <span className="rounded bg-[rgb(var(--ink-rgb)/0.08)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                      Custom
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                  <Globe className="h-3 w-3" />
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>{source.url}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={source.enabled}
                  onChange={() => handleToggle(source.id, source.enabled)}
                  className="rounded border-[rgb(var(--ink-rgb)/0.2)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-[var(--muted)]">
                  {source.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>

              {source.isCustom && (
                <button
                  type="button"
                  onClick={() => handleDelete(source.id)}
                  title="Delete custom source"
                  aria-label={`Delete ${source.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded text-[var(--muted)] hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

