import { getCpu, getGame, getGpu, getMemory, getWorkload } from "@/data";
import type { BuildSelection, PredictionResult } from "@/lib/types";
import { predictCoding } from "./coding";
import { predictGaming } from "./gaming";

export { predictCoding } from "./coding";
export { predictGaming } from "./gaming";

export function predictBuild(selection: BuildSelection): PredictionResult {
  const missing: PredictionResult["missing"] = [];
  if (!selection.cpuId) missing.push("cpu");
  if (!selection.gpuId) missing.push("gpu");
  if (!selection.memoryId) missing.push("memory");

  const cpu = selection.cpuId ? getCpu(selection.cpuId) : undefined;
  const gpu = selection.gpuId ? getGpu(selection.gpuId) : undefined;
  const memory = selection.memoryId ? getMemory(selection.memoryId) : undefined;
  const game = getGame(selection.gameId);
  const workload = getWorkload(selection.workloadId);

  let gaming: PredictionResult["gaming"] = null;
  let coding: PredictionResult["coding"] = null;

  if (cpu && gpu && memory && game) {
    gaming = predictGaming({
      cpu,
      gpu,
      memory,
      game,
      resolution: selection.resolution,
      quality: selection.quality,
    });
  }

  if (cpu && memory && workload) {
    coding = predictCoding({ cpu, memory, workload });
  }

  return { gaming, coding, missing };
}
