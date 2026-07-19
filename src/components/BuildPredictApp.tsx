"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DATA_PROVENANCE } from "@/data";
import { BuilderTable } from "@/components/BuilderTable";
import { Navbar } from "@/components/Navbar";
import { PartBrowser } from "@/components/PartBrowser";
import { PredictionPanel } from "@/components/PredictionPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SummaryBar } from "@/components/SummaryBar";
import { CATEGORY_BY_ID, type CategoryId } from "@/lib/categories";
import {
  addPartToSlot,
  DEFAULT_SELECTION,
  removePartFromSlot,
  selectionFromSearchParams,
  selectionToSearchParams,
} from "@/lib/build-state";
import { loadManifest, resolveParts } from "@/lib/catalog";
import { fetchLiveQuotes } from "@/lib/pricing/client";
import { predictBuildFromParts } from "@/lib/predict";
import type { BuildSelection, CatalogPart, PriceQuote } from "@/lib/types";

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
  const [browserSlot, setBrowserSlot] = useState<CategoryId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resolved, setResolved] = useState<
    Partial<Record<CategoryId, CatalogPart[]>>
  >({});
  const [quotes, setQuotes] = useState<PriceQuote[]>([]);
  const [catalogNote, setCatalogNote] = useState<string>(DATA_PROVENANCE.note);

  const selection = useMemo(
    () =>
      selectionFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  function commit(next: BuildSelection) {
    router.replace(`${pathname}?${selectionToSearchParams(next)}`, {
      scroll: false,
    });
  }

  function patchSelection(patch: Partial<BuildSelection>) {
    commit({ ...selection, ...patch });
  }

  useEffect(() => {
    loadManifest()
      .then((m) => {
        setCatalogNote(
          `${m.attribution} Revision ${m.sourceRevision.slice(0, 12)}.`,
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = Object.entries(selection.parts) as Array<
        [CategoryId, string[]]
      >;
      const next: Partial<Record<CategoryId, CatalogPart[]>> = {};
      await Promise.all(
        entries.map(async ([cat, ids]) => {
          next[cat] = await resolveParts(selection.customParts, cat, ids);
        }),
      );
      if (!cancelled) setResolved(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [selection.parts, selection.customParts]);

  const result = useMemo(() => {
    return predictBuildFromParts(selection, {
      cpu: resolved.cpu?.[0],
      cooler: resolved["cpu-cooler"]?.[0],
      motherboard: resolved.motherboard?.[0],
      memory: resolved.memory ?? [],
      storage: resolved.storage ?? [],
      gpu: resolved.gpu?.[0],
      pcCase: resolved.case?.[0],
      psu: resolved.psu?.[0],
    });
  }, [selection, resolved]);

  const allSelectedParts = useMemo(
    () => Object.values(resolved).flatMap((list) => list ?? []),
    [resolved],
  );

  useEffect(() => {
    let cancelled = false;
    fetchLiveQuotes(allSelectedParts)
      .then((q) => {
        if (!cancelled) setQuotes(q);
      })
      .catch(() => {
        if (!cancelled) setQuotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [allSelectedParts]);

  const liveTotal = useMemo(() => {
    if (!quotes.length && !Object.keys(selection.priceOverrides).length) {
      return null;
    }
    let total = 0;
    let counted = false;
    for (const part of allSelectedParts) {
      if (selection.priceOverrides[part.id] != null) {
        total += selection.priceOverrides[part.id];
        counted = true;
        continue;
      }
      const quote = quotes.find((q) => q.partId === part.id);
      if (quote) {
        total += quote.price;
        counted = true;
      }
    }
    return counted ? total : null;
  }, [quotes, selection.priceOverrides, allSelectedParts]);

  const compatibilityFilter = useCallback(
    (part: CatalogPart) => {
      if (!browserSlot) return true;
      if (browserSlot === "cpu" && resolved.motherboard?.[0]) {
        const mbSocket = String(resolved.motherboard[0].specs.socket || "");
        const cpuSocket = String(part.specs.socket || "");
        if (!mbSocket || !cpuSocket) return true;
        return (
          mbSocket.replace(/\s+/g, "").toLowerCase() ===
          cpuSocket.replace(/\s+/g, "").toLowerCase()
        );
      }
      if (browserSlot === "motherboard" && resolved.cpu?.[0]) {
        const cpuSocket = String(resolved.cpu[0].specs.socket || "");
        const mbSocket = String(part.specs.socket || "");
        if (!mbSocket || !cpuSocket) return true;
        return (
          mbSocket.replace(/\s+/g, "").toLowerCase() ===
          cpuSocket.replace(/\s+/g, "").toLowerCase()
        );
      }
      if (browserSlot === "memory" && resolved.motherboard?.[0]) {
        const ramType = String(resolved.motherboard[0].specs.ramType || "");
        const kitType = String(part.specs.ramType || "");
        if (!ramType || !kitType) return true;
        return ramType.toUpperCase() === kitType.toUpperCase();
      }
      return true;
    },
    [browserSlot, resolved],
  );

  function clearSlot(slot: CategoryId, id?: string) {
    commit(removePartFromSlot(selection, slot, id));
  }

  function addPart(id: string, custom?: CatalogPart) {
    if (!browserSlot) return;
    const multiple = CATEGORY_BY_ID[browserSlot].multiple;
    let next = selection;
    if (custom) {
      next = {
        ...next,
        customParts: { ...next.customParts, [custom.id]: custom },
      };
    }
    next = addPartToSlot(next, browserSlot, id, multiple);
    commit(next);
    setBrowserSlot(null);
  }

  return (
    <AppShell
      selection={selection}
      result={result}
      resolved={resolved}
      browserSlot={browserSlot}
      settingsOpen={settingsOpen}
      catalogNote={catalogNote}
      liveTotal={liveTotal}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={() => setSettingsOpen(false)}
      onChoose={setBrowserSlot}
      onClear={clearSlot}
      onAdd={addPart}
      onCloseBrowser={() => setBrowserSlot(null)}
      onChange={patchSelection}
      onToggleExtras={() =>
        patchSelection({ showExtras: !selection.showExtras })
      }
      compatibilityFilter={compatibilityFilter}
    />
  );
}

function AppShell({
  loading = false,
  selection = DEFAULT_SELECTION,
  result,
  resolved = {},
  browserSlot = null,
  settingsOpen = false,
  catalogNote = DATA_PROVENANCE.note,
  liveTotal = null,
  onOpenSettings,
  onCloseSettings,
  onChoose,
  onClear,
  onAdd,
  onCloseBrowser,
  onChange,
  onToggleExtras,
  compatibilityFilter,
}: {
  loading?: boolean;
  selection?: BuildSelection;
  result?: ReturnType<typeof predictBuildFromParts>;
  resolved?: Partial<Record<CategoryId, CatalogPart[]>>;
  browserSlot?: CategoryId | null;
  settingsOpen?: boolean;
  catalogNote?: string;
  liveTotal?: number | null;
  onOpenSettings?: () => void;
  onCloseSettings?: () => void;
  onChoose?: (slot: CategoryId) => void;
  onClear?: (slot: CategoryId, id?: string) => void;
  onAdd?: (id: string, custom?: CatalogPart) => void;
  onCloseBrowser?: () => void;
  onChange?: (patch: Partial<BuildSelection>) => void;
  onToggleExtras?: () => void;
  compatibilityFilter?: (part: CatalogPart) => boolean;
}) {
  const resolvedResult =
    result ??
    predictBuildFromParts(selection, { memory: [], storage: [] });

  return (
    <>
      <Navbar onOpenSettings={onOpenSettings} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
        <section className="space-y-2">
          <h1 className="font-mono text-2xl tracking-[0.08em] text-accent sm:text-3xl">
            PC Stats & Frame Predictor
          </h1>
          <p className="max-w-3xl text-sm text-muted">
            Full System Builder with {DATA_PROVENANCE.totalParts.toLocaleString()}{" "}
            OpenDB parts, compatibility checks, FPS estimates, and optional live
            pricing. Not affiliated with PCPartPicker.
          </p>
        </section>

        {loading ? (
          <div className="glow-panel px-4 py-10 text-center font-mono text-sm text-muted">
            Loading builder state…
          </div>
        ) : (
          <>
            <SummaryBar result={resolvedResult} liveTotal={liveTotal} />

            {settingsOpen ? (
              <SettingsPanel open onClose={onCloseSettings!} />
            ) : null}

            {browserSlot ? (
              <PartBrowser
                slot={browserSlot}
                onAdd={onAdd!}
                onClose={onCloseBrowser!}
                compatibilityFilter={compatibilityFilter}
              />
            ) : (
              <BuilderTable
                selection={selection}
                resolved={resolved}
                issues={resolvedResult.compatibility.issues}
                onChoose={onChoose!}
                onClear={onClear!}
                onToggleExtras={onToggleExtras!}
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
          {catalogNote} Outputs are model estimates, not measured guarantees.
          Share builds via the URL.
        </footer>
      </main>
    </>
  );
}
