import type { PredictionResult } from "@/lib/types";

export function SummaryBar({ result }: { result: PredictionResult }) {
  const fps = result.gaming?.avgFps.expected;
  const watts = result.gaming?.estimatedSystemWatts;
  const score = result.coding?.score.expected;
  const limiter =
    result.gaming?.limitingComponent ??
    result.coding?.limitingComponent ??
    "—";

  return (
    <div className="glow-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
        <Stat
          label="Est. Wattage"
          value={watts != null ? `${watts} W` : "—"}
        />
        <Stat label="Pred. FPS" value={fps != null ? `${fps}` : "—"} />
        <Stat label="Code Score" value={score != null ? `${score}` : "—"} />
        <Stat label="Limiter" value={String(limiter).toUpperCase()} />
      </div>
      {result.missing.length > 0 ? (
        <p className="text-xs text-warning">
          Missing: {result.missing.map((m) => m.toUpperCase()).join(", ")}
        </p>
      ) : (
        <p className="text-xs text-muted">Build ready for prediction</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="text-accent">{value}</div>
    </div>
  );
}
