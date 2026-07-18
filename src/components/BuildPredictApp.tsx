"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DATA_PROVENANCE } from "@/data";
import { BuilderTable } from "@/components/BuilderTable";
import { Navbar } from "@/components/Navbar";
import { PartBrowser } from "@/components/PartBrowser";
import { PredictionPanel } from "@/components/PredictionPanel";
import { SummaryBar } from "@/components/SummaryBar";
import {
  DEFAULT_SELECTION,
  selectionFromSearchParams,
  selectionToSearchParams,
  type BrowserSlot,
} from "@/lib/build-state";
import { predictBuild } from "@/lib/predict";
import type { BuildSelection } from "@/lib/types";

export function BuildPredictApp() {
  return (
    <Suspense fallback={<AppShell loading />}>
      <BuildPredictAppInner />
    </Suspense>
  );
}

function BuildPredictAppInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [browserSlot, setBrowserSlot] = useState<BrowserSlot | null>(null);

  const selection = useMemo(
    () =>
      selectionFromSearchParams(
        new URLSearchParams(searchParams.toString()),
      ),
    [searchParams],
  );

  const result = useMemo(() => predictBuild(selection), [selection]);

  function commit(next: BuildSelection) {
    router.replace(`${pathname}?${selectionToSearchParams(next)}`, {
      scroll: false,
    });
  }

  function patchSelection(patch: Partial<BuildSelection>) {
    commit({ ...selection, ...patch });
  }

  function clearSlot(slot: BrowserSlot) {
    if (slot === "cpu") patchSelection({ cpuId: null });
    if (slot === "gpu") patchSelection({ gpuId: null });
    if (slot === "memory") patchSelection({ memoryId: null });
  }

  function addPart(id: string) {
    if (!browserSlot) return;
    if (browserSlot === "cpu") patchSelection({ cpuId: id });
    if (browserSlot === "gpu") patchSelection({ gpuId: id });
    if (browserSlot === "memory") patchSelection({ memoryId: id });
    setBrowserSlot(null);
  }

  return (
    <AppShell
      selection={selection}
      result={result}
      browserSlot={browserSlot}
      onChoose={setBrowserSlot}
      onClear={clearSlot}
      onAdd={addPart}
      onCloseBrowser={() => setBrowserSlot(null)}
      onChange={patchSelection}
    />
  );
}

function AppShell({
  loading = false,
  selection = DEFAULT_SELECTION,
  result,
  browserSlot = null,
  onChoose,
  onClear,
  onAdd,
  onCloseBrowser,
  onChange,
}: {
  loading?: boolean;
  selection?: BuildSelection;
  result?: ReturnType<typeof predictBuild>;
  browserSlot?: BrowserSlot | null;
  onChoose?: (slot: BrowserSlot) => void;
  onClear?: (slot: BrowserSlot) => void;
  onAdd?: (id: string) => void;
  onCloseBrowser?: () => void;
  onChange?: (patch: Partial<BuildSelection>) => void;
}) {
  const resolvedResult = result ?? predictBuild(selection);

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
        <section className="space-y-2">
          <h1 className="font-mono text-2xl tracking-[0.08em] text-accent sm:text-3xl">
            PC Stats & Frame Predictor
          </h1>
          <p className="max-w-3xl text-sm text-muted">
            Build a rig in a PCPartPicker-style System Builder, then estimate
            gaming FPS and coding workload performance. Catalog is curated
            locally ({DATA_PROVENANCE.version}) — direct PCPartPicker import is
            not available because there is no supported public API.
          </p>
        </section>

        {loading ? (
          <div className="glow-panel px-4 py-10 text-center font-mono text-sm text-muted">
            Loading builder state…
          </div>
        ) : (
          <>
            <SummaryBar result={resolvedResult} />

            {browserSlot ? (
              <PartBrowser
                slot={browserSlot}
                onAdd={onAdd!}
                onClose={onCloseBrowser!}
              />
            ) : (
              <BuilderTable
                selection={selection}
                onChoose={onChoose!}
                onClear={onClear!}
              />
            )}

            <PredictionPanel
              selection={selection}
              result={resolvedResult}
              onChange={onChange!}
            />
          </>
        )}

        <footer className="border-t border-border pt-4 text-xs text-muted">
          Data {DATA_PROVENANCE.updated} · {DATA_PROVENANCE.note} Outputs are
          model estimates, not measured guarantees. Share builds via the URL.
        </footer>
      </main>
    </>
  );
}
