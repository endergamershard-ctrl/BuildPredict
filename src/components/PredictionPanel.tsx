import { GAMES, WORKLOADS } from "@/data";
import type {
  BuildSelection,
  PredictionResult,
  QualityPreset,
  Resolution,
} from "@/lib/types";

interface PredictionPanelProps {
  selection: BuildSelection;
  result: PredictionResult;
  onChange: (patch: Partial<BuildSelection>) => void;
}

export function PredictionPanel({
  selection,
  result,
  onChange,
}: PredictionPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="glow-panel p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Gaming Prediction
          </h2>
          <span className="badge">estimate</span>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Game">
            <select
              className="field"
              value={selection.gameId}
              onChange={(e) => onChange({ gameId: e.target.value })}
            >
              {GAMES.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Resolution">
            <select
              className="field"
              value={selection.resolution}
              onChange={(e) =>
                onChange({ resolution: e.target.value as Resolution })
              }
            >
              <option value="1080p">1080p</option>
              <option value="1440p">1440p</option>
              <option value="4k">4K</option>
            </select>
          </Field>
          <Field label="Quality">
            <select
              className="field"
              value={selection.quality}
              onChange={(e) =>
                onChange({ quality: e.target.value as QualityPreset })
              }
            >
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </Field>
        </div>

        {result.gaming ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Avg FPS"
                value={`${result.gaming.avgFps.expected}`}
              />
              <Metric
                label="1% Low"
                value={`${result.gaming.onePercentLow}`}
              />
              <Metric
                label="CPU Util"
                value={`${result.gaming.cpuUtilPct}%`}
              />
              <Metric
                label="GPU Util"
                value={`${result.gaming.gpuUtilPct}%`}
              />
            </div>
            <p className="font-mono text-sm text-accent">
              Range {result.gaming.avgFps.low}–{result.gaming.avgFps.high} FPS ·
              Limiter: {result.gaming.limitingComponent.toUpperCase()}
            </p>
            <ul className="space-y-1 text-sm text-muted">
              {result.gaming.explanations.map((line) => (
                <li key={line}>{`// ${line}`}</li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState text="Select CPU, GPU, and Memory to unlock FPS estimates." />
        )}
      </section>

      <section className="glow-panel p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
            Coding / Workload Prediction
          </h2>
          <span className="badge">estimate</span>
        </div>

        <div className="mb-4">
          <Field label="Workload">
            <select
              className="field"
              value={selection.workloadId}
              onChange={(e) => onChange({ workloadId: e.target.value })}
            >
              {WORKLOADS.map((workload) => (
                <option key={workload.id} value={workload.id}>
                  {workload.name}
                </option>
              ))}
            </select>
          </Field>
          <p className="mt-2 text-xs text-muted">
            {
              WORKLOADS.find((w) => w.id === selection.workloadId)
                ?.description
            }
          </p>
        </div>

        {result.coding ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric
                label="Score"
                value={`${result.coding.score.expected}`}
              />
              <Metric
                label="CPU Load"
                value={`${result.coding.estimatedCpuLoadPct}%`}
              />
              <Metric
                label="Mem Pressure"
                value={`${result.coding.memoryPressurePct}%`}
              />
            </div>
            <p className="font-mono text-sm text-accent">
              Range {result.coding.score.low}–{result.coding.score.high} ·
              Limiter: {result.coding.limitingComponent.toUpperCase()}
            </p>
            <ul className="space-y-1 text-sm text-muted">
              {result.coding.explanations.map((line) => (
                <li key={line}>{`// ${line}`}</li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState text="Select CPU and Memory to unlock coding workload estimates." />
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-xs uppercase tracking-[0.12em] text-muted">
      {label}
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background/70 p-3">
      <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl text-accent">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
      {text}
    </div>
  );
}
