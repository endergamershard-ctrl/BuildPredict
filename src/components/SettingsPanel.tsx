"use client";

import { useEffect, useState } from "react";
import {
  getPricingSettings,
  isTauriRuntime,
  savePricingSettings,
  type PricingSettings,
} from "@/lib/pricing/client";

export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<PricingSettings>({
    bestBuyKey: "",
    retailerApiKey: "",
    enabledProviders: [],
  });
  const [status, setStatus] = useState<string | null>(null);
  const desktop = isTauriRuntime();

  useEffect(() => {
    if (!open) return;
    getPricingSettings().then(setSettings).catch(() => undefined);
  }, [open]);

  if (!open) return null;

  async function save() {
    await savePricingSettings(settings);
    setStatus("Saved. Live prices refresh when you fetch quotes.");
  }

  return (
    <div className="glow-panel space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          Settings // Live Pricing
        </h2>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>

      {!desktop ? (
        <p className="text-sm text-warning">
          Live retailer pricing runs in the desktop app only (Tauri). Browser
          mode still supports manual price overrides.
        </p>
      ) : (
        <p className="text-sm text-muted">
          Keys stay in the OS credential store and are only used for supported
          retailer APIs you enable. The app works fully without keys.
        </p>
      )}

      <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
        Best Buy API Key
        <input
          className="field"
          type="password"
          disabled={!desktop}
          value={settings.bestBuyKey}
          onChange={(e) =>
            setSettings((s) => ({ ...s, bestBuyKey: e.target.value }))
          }
          placeholder="Best Buy developer key"
        />
      </label>

      <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
        RetailerAPI Key
        <input
          className="field"
          type="password"
          disabled={!desktop}
          value={settings.retailerApiKey}
          onChange={(e) =>
            setSettings((s) => ({ ...s, retailerApiKey: e.target.value }))
          }
          placeholder="rk_live_…"
        />
      </label>

      <div className="flex flex-wrap gap-4 text-sm text-muted">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={!desktop || !settings.bestBuyKey}
            checked={settings.enabledProviders.includes("bestbuy")}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                enabledProviders: e.target.checked
                  ? Array.from(new Set([...s.enabledProviders, "bestbuy" as const]))
                  : s.enabledProviders.filter((p) => p !== "bestbuy"),
              }))
            }
          />
          Enable Best Buy
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            disabled={!desktop || !settings.retailerApiKey}
            checked={settings.enabledProviders.includes("retailerapi")}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                enabledProviders: e.target.checked
                  ? Array.from(
                      new Set([...s.enabledProviders, "retailerapi" as const]),
                    )
                  : s.enabledProviders.filter((p) => p !== "retailerapi"),
              }))
            }
          />
          Enable RetailerAPI
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className="btn-matrix" disabled={!desktop} onClick={save}>
          Save settings
        </button>
        {status ? <span className="text-xs text-accent">{status}</span> : null}
      </div>
    </div>
  );
}
