import type { PredictionResult, PriceQuote } from "@/lib/types";

export function SummaryBar({
  result,
  liveTotal,
}: {
  result: PredictionResult;
  liveTotal?: number | null;
}) {
  const fps = result.gaming?.avgFps.expected;
  const watts = result.compatibility.estimatedWatts;
  const score = result.coding?.score.expected;
  const limiter =
    result.gaming?.limitingComponent ??
    result.coding?.limitingComponent ??
    "—";
  const price =
    liveTotal ??
    result.totalManualPrice;

  return (
    <div className="glow-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-sm">
        <Stat label="Est. Wattage" value={watts ? `${watts} W` : "—"} />
        <Stat label="Pred. FPS" value={fps != null ? `${fps}` : "—"} />
        <Stat label="Code Score" value={score != null ? `${score}` : "—"} />
        <Stat label="Limiter" value={String(limiter).toUpperCase()} />
        <Stat
          label="Price"
          value={price != null ? `$${price.toFixed(0)}` : "—"}
        />
        <Stat
          label="Compat"
          value={
            result.compatibility.hardErrors
              ? `${result.compatibility.hardErrors} ERR`
              : result.compatibility.warnings
                ? `${result.compatibility.warnings} WARN`
                : "OK"
          }
        />
      </div>
      {result.missing.length > 0 ? (
        <p className="text-xs text-warning">
          Missing for predictions:{" "}
          {result.missing.map((m) => m.toUpperCase()).join(", ")}
        </p>
      ) : (
        <p className="text-xs text-muted">
          Confidence: {result.gaming?.confidence ?? result.coding?.confidence ?? "—"}
        </p>
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

export type { PriceQuote };
