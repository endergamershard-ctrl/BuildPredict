import { QUALITY_SCALE, RESOLUTION_SCALE } from "@/data/games";
import type {
  CpuPart,
  GameTitle,
  GamingPrediction,
  GpuPart,
  MemoryPart,
  QualityPreset,
  Resolution,
} from "@/lib/types";

const REFERENCE_GPU_INDEX = 100;
const REFERENCE_FPS = 90;
const PLATFORM_WATTS = 75;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

export function predictGaming(input: {
  cpu: CpuPart;
  gpu: GpuPart;
  memory: MemoryPart;
  game: GameTitle;
  resolution: Resolution;
  quality: QualityPreset;
}): GamingPrediction {
  const { cpu, gpu, memory, game, resolution, quality } = input;

  const gpuScaled =
    (gpu.rasterIndex / REFERENCE_GPU_INDEX) *
    (100 / game.gpuDemand) *
    RESOLUTION_SCALE[resolution] *
    QUALITY_SCALE[quality];

  let gpuLimitedFps = REFERENCE_FPS * gpuScaled;

  // Light VRAM pressure at 4K / Ultra when under 12GB
  if (resolution === "4k" && quality === "ultra" && gpu.vramGb < 12) {
    gpuLimitedFps *= 0.9;
  } else if (resolution === "1440p" && quality === "ultra" && gpu.vramGb < 8) {
    gpuLimitedFps *= 0.92;
  }

  // CPU can sustain a capped FPS based on single-thread strength and game CPU demand
  const cpuCap =
    40 +
    cpu.singleThreadIndex * (1.35 - game.cpuDemand / 200) +
    Math.max(0, cpu.cores - 4) * 2.5;

  // RAM headroom: <16GB mildly hurts; slow kits slightly reduce CPU cap
  let ramFactor = 1;
  if (memory.capacityGb < 16) {
    ramFactor = 0.88;
  } else if (memory.capacityGb < 32 && game.gpuDemand > 120) {
    ramFactor = 0.96;
  }
  if (memory.type === "DDR4" && memory.speedMtps < 3200) {
    ramFactor *= 0.97;
  } else if (memory.type === "DDR5" && memory.speedMtps >= 6000) {
    ramFactor *= 1.02;
  }

  const cpuLimitedFps = cpuCap * ramFactor;
  // Low system RAM can also hitch GPU-bound titles via streaming/stutter.
  const avgExpected =
    Math.min(gpuLimitedFps, cpuLimitedFps) *
    (memory.capacityGb < 16 ? Math.min(ramFactor, 0.9) : 1);
  const cpuBound = cpuLimitedFps < gpuLimitedFps * 0.97;
  const gpuBound = gpuLimitedFps < cpuLimitedFps * 0.97;

  let limitingComponent: GamingPrediction["limitingComponent"] = "balanced";
  if (cpuBound && !gpuBound) limitingComponent = "cpu";
  else if (gpuBound && !cpuBound) limitingComponent = "gpu";
  else if (memory.capacityGb < 16) limitingComponent = "memory";

  const gpuUtilPct = clamp(round((avgExpected / gpuLimitedFps) * 100), 45, 99);
  const cpuUtilPct = clamp(round((avgExpected / cpuLimitedFps) * 100), 35, 99);

  const spread = limitingComponent === "balanced" ? 0.08 : 0.12;
  const avgFps = {
    low: round(avgExpected * (1 - spread)),
    expected: round(avgExpected),
    high: round(avgExpected * (1 + spread * 0.7)),
  };

  const onePercentLow = round(avgExpected * (cpuBound ? 0.72 : 0.82));
  const estimatedSystemWatts = round(
    PLATFORM_WATTS + cpu.tdpW * 0.65 + gpu.tdpW * 0.85 + memory.tdpW,
  );

  const explanations: string[] = [
    `Model scales ${gpu.name} raster index (${gpu.rasterIndex}) for ${game.name} at ${resolution} ${quality}.`,
    cpuBound
      ? `${cpu.name} is the likely ceiling (~${round(cpuLimitedFps)} FPS cap).`
      : `${gpu.name} is the primary limiter for this preset.`,
  ];

  if (memory.capacityGb < 16) {
    explanations.push("Under 16GB RAM applies a frame-rate penalty in this model.");
  }
  if (resolution === "4k" && gpu.vramGb < 12) {
    explanations.push("4K Ultra with under 12GB VRAM includes a VRAM pressure adjustment.");
  }
  explanations.push("Estimates only — real FPS varies with drivers, settings, and scenes.");

  return {
    avgFps,
    onePercentLow,
    cpuUtilPct,
    gpuUtilPct,
    limitingComponent,
    estimatedSystemWatts,
    explanations,
  };
}
