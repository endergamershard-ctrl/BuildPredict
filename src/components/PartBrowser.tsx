"use client";

import { useMemo, useState } from "react";
import { CPUS, GPUS, MEMORY } from "@/data";
import type { BrowserSlot } from "@/lib/build-state";
import { slotLabel } from "@/lib/build-state";

interface PartBrowserProps {
  slot: BrowserSlot;
  onAdd: (id: string) => void;
  onClose: () => void;
}

type SortKey = "name" | "perf" | "power" | "capacity";

export function PartBrowser({ slot, onAdd, onClose }: PartBrowserProps) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("perf");

  const brands = useMemo(() => {
    if (slot === "cpu") return ["AMD", "Intel"];
    if (slot === "gpu") return ["NVIDIA", "AMD", "Intel"];
    return ["DDR4", "DDR5"];
  }, [slot]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (slot === "cpu") {
      return CPUS.filter((cpu) => {
        const brandOk = brand === "all" || cpu.brand === brand;
        const textOk =
          !q ||
          cpu.name.toLowerCase().includes(q) ||
          cpu.socket.toLowerCase().includes(q);
        return brandOk && textOk;
      })
        .sort((a, b) => {
          if (sortKey === "name") return a.name.localeCompare(b.name);
          if (sortKey === "power") return a.tdpW - b.tdpW;
          return b.singleThreadIndex - a.singleThreadIndex;
        })
        .map((cpu) => ({
          id: cpu.id,
          name: cpu.name,
          meta: `${cpu.brand} · ${cpu.cores}C/${cpu.threads}T · ${cpu.boostGhz} GHz · ${cpu.socket}`,
          score: `ST ${cpu.singleThreadIndex} / MT ${cpu.multiThreadIndex}`,
          power: `${cpu.tdpW}W`,
        }));
    }

    if (slot === "gpu") {
      return GPUS.filter((gpu) => {
        const brandOk = brand === "all" || gpu.brand === brand;
        const textOk = !q || gpu.name.toLowerCase().includes(q);
        return brandOk && textOk;
      })
        .sort((a, b) => {
          if (sortKey === "name") return a.name.localeCompare(b.name);
          if (sortKey === "power") return a.tdpW - b.tdpW;
          if (sortKey === "capacity") return b.vramGb - a.vramGb;
          return b.rasterIndex - a.rasterIndex;
        })
        .map((gpu) => ({
          id: gpu.id,
          name: gpu.name,
          meta: `${gpu.brand} · ${gpu.vramGb}GB · ${gpu.tier}`,
          score: `Raster ${gpu.rasterIndex}`,
          power: `${gpu.tdpW}W`,
        }));
    }

    return MEMORY.filter((kit) => {
      const typeOk = brand === "all" || kit.type === brand;
      const textOk = !q || kit.name.toLowerCase().includes(q);
      return typeOk && textOk;
    })
      .sort((a, b) => {
        if (sortKey === "name") return a.name.localeCompare(b.name);
        if (sortKey === "power") return a.tdpW - b.tdpW;
        return b.capacityGb - a.capacityGb || b.speedMtps - a.speedMtps;
      })
      .map((kit) => ({
        id: kit.id,
        name: kit.name,
        meta: `${kit.type} · ${kit.modules}`,
        score: `${kit.capacityGb}GB @ ${kit.speedMtps}`,
        power: `${kit.tdpW}W`,
      }));
  }, [slot, query, brand, sortKey]);

  return (
    <div className="glow-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Part Browser // {slotLabel(slot)}
          </div>
          <p className="text-xs text-muted">
            Manual curated catalog — not live PCPartPicker data.
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Back to builder
        </button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4 rounded border border-border bg-surface-alt/60 p-3">
          <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
            Search
            <input
              className="field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${slotLabel(slot)}…`}
            />
          </label>

          <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
            {slot === "memory" ? "Type" : "Brand"}
            <select
              className="field"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value="all">All</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
            Sort
            <select
              className="field"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="perf">Performance</option>
              <option value="name">Name</option>
              <option value="power">Power</option>
              {(slot === "gpu" || slot === "memory") && (
                <option value="capacity">Capacity</option>
              )}
            </select>
          </label>
        </aside>

        <div className="overflow-x-auto rounded border border-border">
          <table className="matrix-table min-w-[700px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Details</th>
                <th>Index</th>
                <th>Power</th>
                <th className="w-28"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.name}</td>
                  <td className="text-sm text-muted">{row.meta}</td>
                  <td className="font-mono text-sm text-accent">{row.score}</td>
                  <td className="text-sm">{row.power}</td>
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
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No parts match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
