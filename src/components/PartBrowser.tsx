"use client";

import { useEffect, useMemo, useState } from "react";
import { browseCategory } from "@/lib/catalog";
import { makeCustomPart, slotLabel } from "@/lib/build-state";
import type { CategoryId } from "@/lib/categories";
import type { CatalogPart } from "@/lib/types";

interface PartBrowserProps {
  slot: CategoryId;
  onAdd: (id: string, custom?: CatalogPart) => void;
  onClose: () => void;
  compatibleOnly?: boolean;
  compatibilityFilter?: (part: CatalogPart) => boolean;
}

const PAGE_SIZE = 40;

interface CatalogSnap {
  key: string;
  parts: CatalogPart[];
  total: number;
  manufacturers: string[];
  error: string | null;
}

export function PartBrowser({
  slot,
  onAdd,
  onClose,
  compatibleOnly = false,
  compatibilityFilter,
}: PartBrowserProps) {
  const [query, setQuery] = useState("");
  const [manufacturer, setManufacturer] = useState("all");
  const [page, setPage] = useState(0);
  const [filterCompat, setFilterCompat] = useState(compatibleOnly);
  const [customName, setCustomName] = useState("");
  const [snap, setSnap] = useState<CatalogSnap | null>(null);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        slot,
        query,
        manufacturer,
        page,
        filterCompat,
      }),
    [slot, query, manufacturer, page, filterCompat],
  );

  useEffect(() => {
    let cancelled = false;
    browseCategory(
      slot,
      {
        query,
        manufacturer,
        predicate:
          filterCompat && compatibilityFilter ? compatibilityFilter : undefined,
      },
      page,
      PAGE_SIZE,
    )
      .then((result) => {
        if (cancelled) return;
        setSnap({
          key: requestKey,
          parts: result.parts,
          total: result.total,
          manufacturers: result.manufacturers,
          error: null,
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setSnap({
          key: requestKey,
          parts: [],
          total: 0,
          manufacturers: [],
          error: err.message || "Failed to load catalog",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [
    slot,
    query,
    manufacturer,
    page,
    filterCompat,
    compatibilityFilter,
    requestKey,
  ]);

  const loading = !snap || snap.key !== requestKey;
  const parts = snap?.key === requestKey ? snap.parts : [];
  const total = snap?.key === requestKey ? snap.total : 0;
  const manufacturers =
    snap?.key === requestKey ? snap.manufacturers : [];
  const error = snap?.key === requestKey ? snap.error : null;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const subtitle = `${total.toLocaleString()} parts · BuildCores OpenDB (ODC-By) · not PCPartPicker`;

  function addCustom() {
    const part = makeCustomPart(slot, customName, "User-entered custom part");
    onAdd(part.id, part);
  }

  return (
    <div className="glow-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Part Browser // {slotLabel(slot)}
          </div>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Back to builder
        </button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4 rounded border border-border bg-surface-alt/60 p-3">
          <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
            Search
            <input
              className="field"
              value={query}
              onChange={(e) => {
                setPage(0);
                setQuery(e.target.value);
              }}
              placeholder={`Filter ${slotLabel(slot)}…`}
            />
          </label>

          <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
            Manufacturer
            <select
              className="field"
              value={manufacturer}
              onChange={(e) => {
                setPage(0);
                setManufacturer(e.target.value);
              }}
            >
              <option value="all">All</option>
              {manufacturers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {compatibilityFilter ? (
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={filterCompat}
                onChange={(e) => {
                  setPage(0);
                  setFilterCompat(e.target.checked);
                }}
              />
              Hide obvious incompatibilities
            </label>
          ) : null}

          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-xs uppercase tracking-[0.12em] text-muted">
              Add custom part
            </div>
            <input
              className="field"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Custom product name"
            />
            <button
              type="button"
              className="btn-matrix w-full"
              disabled={!customName.trim()}
              onClick={addCustom}
            >
              Add custom
            </button>
          </div>
        </aside>

        <div className="overflow-x-auto rounded border border-border">
          {error ? (
            <div className="p-6 text-center text-sm text-danger">{error}</div>
          ) : (
            <table className="matrix-table min-w-[780px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Manufacturer</th>
                  <th>Details</th>
                  <th className="w-28"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      Loading catalog…
                    </td>
                  </tr>
                ) : parts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      No parts match these filters.
                    </td>
                  </tr>
                ) : (
                  parts.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium">{row.name}</td>
                      <td className="text-sm text-muted">{row.manufacturer}</td>
                      <td className="text-sm text-muted">{row.summary}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-matrix"
                          onClick={() => onAdd(row.id)}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted">
            <span>
              Page {page + 1} / {pageCount}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
