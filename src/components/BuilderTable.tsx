import { getCpu, getGpu, getMemory } from "@/data";
import type { BrowserSlot } from "@/lib/build-state";
import { slotLabel } from "@/lib/build-state";
import type { BuildSelection } from "@/lib/types";

interface BuilderTableProps {
  selection: BuildSelection;
  onChoose: (slot: BrowserSlot) => void;
  onClear: (slot: BrowserSlot) => void;
}

export function BuilderTable({
  selection,
  onChoose,
  onClear,
}: BuilderTableProps) {
  const cpu = selection.cpuId ? getCpu(selection.cpuId) : undefined;
  const gpu = selection.gpuId ? getGpu(selection.gpuId) : undefined;
  const memory = selection.memoryId
    ? getMemory(selection.memoryId)
    : undefined;

  const rows: Array<{
    slot: BrowserSlot;
    selected: boolean;
    name: string;
    specs: string;
  }> = [
    {
      slot: "cpu",
      selected: Boolean(cpu),
      name: cpu?.name ?? "",
      specs: cpu
        ? `${cpu.cores}C/${cpu.threads}T · ${cpu.boostGhz} GHz · ${cpu.tdpW}W · ST ${cpu.singleThreadIndex}`
        : "",
    },
    {
      slot: "gpu",
      selected: Boolean(gpu),
      name: gpu?.name ?? "",
      specs: gpu
        ? `${gpu.vramGb}GB · ${gpu.tdpW}W · Raster ${gpu.rasterIndex} · ${gpu.tier}`
        : "",
    },
    {
      slot: "memory",
      selected: Boolean(memory),
      name: memory?.name ?? "",
      specs: memory
        ? `${memory.capacityGb}GB · ${memory.type}-${memory.speedMtps} · ${memory.modules}`
        : "",
    },
  ];

  return (
    <div className="glow-panel overflow-hidden">
      <div className="border-b border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-accent">
        System Builder
      </div>
      <div className="overflow-x-auto">
        <table className="matrix-table min-w-[640px]">
          <thead>
            <tr>
              <th className="w-28">Component</th>
              <th>Selection</th>
              <th>Key Specs</th>
              <th className="w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slot}>
                <td className="font-mono text-sm text-accent">
                  {slotLabel(row.slot)}
                </td>
                <td>
                  {row.selected ? (
                    <span className="font-medium text-foreground">
                      {row.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-matrix"
                      onClick={() => onChoose(row.slot)}
                    >
                      Choose a {slotLabel(row.slot)}
                    </button>
                  )}
                </td>
                <td className="text-sm text-muted">
                  {row.selected ? row.specs : "—"}
                </td>
                <td>
                  {row.selected ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-matrix"
                        onClick={() => onChoose(row.slot)}
                      >
                        Swap
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => onClear(row.slot)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Empty slot</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
