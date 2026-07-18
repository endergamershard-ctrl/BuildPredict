import type {
  BuildSelection,
  ComponentCategory,
  QualityPreset,
  Resolution,
} from "@/lib/types";

export const DEFAULT_SELECTION: BuildSelection = {
  cpuId: null,
  gpuId: null,
  memoryId: null,
  gameId: "cyberpunk",
  workloadId: "backend-compile",
  resolution: "1440p",
  quality: "high",
};

export type BrowserSlot = ComponentCategory;

const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4k"];
const QUALITIES: QualityPreset[] = ["medium", "high", "ultra"];

export function selectionFromSearchParams(
  params: URLSearchParams,
): BuildSelection {
  const resolution = params.get("res");
  const quality = params.get("quality");

  return {
    cpuId: params.get("cpu"),
    gpuId: params.get("gpu"),
    memoryId: params.get("ram"),
    gameId: params.get("game") ?? DEFAULT_SELECTION.gameId,
    workloadId: params.get("work") ?? DEFAULT_SELECTION.workloadId,
    resolution: RESOLUTIONS.includes(resolution as Resolution)
      ? (resolution as Resolution)
      : DEFAULT_SELECTION.resolution,
    quality: QUALITIES.includes(quality as QualityPreset)
      ? (quality as QualityPreset)
      : DEFAULT_SELECTION.quality,
  };
}

export function selectionToSearchParams(selection: BuildSelection): string {
  const params = new URLSearchParams();
  if (selection.cpuId) params.set("cpu", selection.cpuId);
  if (selection.gpuId) params.set("gpu", selection.gpuId);
  if (selection.memoryId) params.set("ram", selection.memoryId);
  params.set("game", selection.gameId);
  params.set("work", selection.workloadId);
  params.set("res", selection.resolution);
  params.set("quality", selection.quality);
  return params.toString();
}

export function slotLabel(slot: BrowserSlot): string {
  switch (slot) {
    case "cpu":
      return "CPU";
    case "gpu":
      return "GPU";
    case "memory":
      return "Memory";
  }
}
