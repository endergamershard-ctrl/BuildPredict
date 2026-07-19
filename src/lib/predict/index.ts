import { getGame } from "@/data/games";
import { getWorkload } from "@/data/workloads";
import { evaluateCompatibility } from "@/lib/compatibility";
import type { BuildSelection, CatalogPart, PredictionResult } from "@/lib/types";
import { predictCoding } from "./coding";
import { predictGaming } from "./gaming";

export { predictCoding } from "./coding";
export { predictGaming } from "./gaming";

export function predictBuildFromParts(
  selection: BuildSelection,
  resolved: {
    cpu?: CatalogPart;
    cooler?: CatalogPart;
    motherboard?: CatalogPart;
    memory: CatalogPart[];
    storage: CatalogPart[];
    gpu?: CatalogPart;
    pcCase?: CatalogPart;
    psu?: CatalogPart;
  },
): PredictionResult {
  const missing: PredictionResult["missing"] = [];
  if (!resolved.cpu) missing.push("cpu");
  if (!resolved.gpu) missing.push("gpu");
  if (!resolved.memory.length) missing.push("memory");

  const compatibility = evaluateCompatibility({
    selection,
    ...resolved,
  });

  const game = getGame(selection.gameId);
  const workload = getWorkload(selection.workloadId);

  let gaming: PredictionResult["gaming"] = null;
  let coding: PredictionResult["coding"] = null;

  if (resolved.cpu && resolved.gpu && resolved.memory.length && game) {
    gaming = predictGaming({
      cpu: resolved.cpu,
      gpu: resolved.gpu,
      memory: resolved.memory,
      game,
      resolution: selection.resolution,
      quality: selection.quality,
      estimatedSystemWatts: compatibility.estimatedWatts,
    });
  }

  if (resolved.cpu && resolved.memory.length && workload) {
    coding = predictCoding({
      cpu: resolved.cpu,
      memory: resolved.memory,
      workload,
    });
  }

  const overrides = Object.values(selection.priceOverrides);
  const totalManualPrice =
    overrides.length > 0
      ? overrides.reduce((sum, n) => sum + n, 0)
      : null;

  return {
    gaming,
    coding,
    missing,
    compatibility,
    totalManualPrice,
  };
}

/** Sync helper for tests with fully provided parts. */
export function predictBuild(
  selection: BuildSelection,
  resolved?: Parameters<typeof predictBuildFromParts>[1],
): PredictionResult {
  return predictBuildFromParts(
    selection,
    resolved ?? {
      memory: [],
      storage: [],
    },
  );
}
