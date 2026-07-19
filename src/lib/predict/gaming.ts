import { QUALITY_SCALE, RESOLUTION_SCALE } from "@/data/games";
import { matchCpuProfile, matchGpuProfile } from "@/data/perf-profiles";
import type {
  CatalogPart,
  GameTitle,
  GamingPrediction,
  QualityPreset,
  Resolution,
} from "@/lib/types";

const REFERENCE_GPU_INDEX = 100;
const REFERENCE_FPS = 90;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

function cpuIndexes(cpu: CatalogPart) {
  const profile = matchCpuProfile(cpu.name);
  if (profile) {
    return {
      single: profile.singleThreadIndex,
      multi: profile.multiThreadIndex,
      tdpW: cpu.tdpW ?? profile.tdpW,
      confidence: "high" as const,
      label: profile.id,
    };
  }
  const cores = Number(cpu.specs.cores) || 6;
  const threads = Number(cpu.specs.threads) || cores;
  const boost = Number(cpu.specs.boostGhz) || 4.0;
  // Conservative spec-based estimate when no curated profile exists.
  const single = Math.round(80 + boost * 12 + Math.min(cores, 8) * 2);
  const multi = Math.round(single * (0.55 + threads / 20));
  return {
    single,
    multi,
    tdpW: cpu.tdpW ?? 65,
    confidence: "low" as const,
    label: "spec-estimate",
  };
}

function gpuIndexes(gpu: CatalogPart) {
  const profile = matchGpuProfile(gpu.name);
  if (profile) {
    return {
      raster: profile.rasterIndex,
      vramGb: Number(gpu.specs.vramGb) || profile.vramGb,
      tdpW: gpu.tdpW ?? profile.tdpW,
      confidence: "high" as const,
      label: profile.id,
    };
  }
  const vram = Number(gpu.specs.vramGb) || 8;
  const tdp = gpu.tdpW ?? 150;
  const raster = Math.round(40 + vram * 8 + tdp * 0.25);
  return {
    raster,
    vramGb: vram,
    tdpW: tdp,
    confidence: "low" as const,
    label: "spec-estimate",
  };
}

export function predictGaming(input: {
  cpu: CatalogPart;
  gpu: CatalogPart;
  memory: CatalogPart[];
  game: GameTitle;
  resolution: Resolution;
  quality: QualityPreset;
  estimatedSystemWatts: number;
}): GamingPrediction {
  const { cpu, gpu, memory, game, resolution, quality, estimatedSystemWatts } =
    input;

  const cpuIdx = cpuIndexes(cpu);
  const gpuIdx = gpuIndexes(gpu);
  const capacityGb = memory.reduce(
    (sum, kit) => sum + (Number(kit.specs.capacityGb) || 0),
    0,
  );
  const maxSpeed = Math.max(
    0,
    ...memory.map((kit) => Number(kit.specs.speedMtps) || 0),
  );
  const ramType = String(memory[0]?.specs.ramType || "");

  const gpuScaled =
    (gpuIdx.raster / REFERENCE_GPU_INDEX) *
    (100 / game.gpuDemand) *
    RESOLUTION_SCALE[resolution] *
    QUALITY_SCALE[quality];

  let gpuLimitedFps = REFERENCE_FPS * gpuScaled;

  if (resolution === "4k" && quality === "ultra" && gpuIdx.vramGb < 12) {
    gpuLimitedFps *= 0.9;
  } else if (resolution === "1440p" && quality === "ultra" && gpuIdx.vramGb < 8) {
    gpuLimitedFps *= 0.92;
  }

  const cpuCap =
    40 +
    cpuIdx.single * (1.35 - game.cpuDemand / 200) +
    Math.max(0, (Number(cpu.specs.cores) || 6) - 4) * 2.5;

  let ramFactor = 1;
  if (capacityGb > 0 && capacityGb < 16) ramFactor = 0.88;
  else if (capacityGb > 0 && capacityGb < 32 && game.gpuDemand > 120) {
    ramFactor = 0.96;
  }
  if (ramType === "DDR4" && maxSpeed > 0 && maxSpeed < 3200) ramFactor *= 0.97;
  if (ramType === "DDR5" && maxSpeed >= 6000) ramFactor *= 1.02;

  const cpuLimitedFps = cpuCap * ramFactor;
  const avgExpected =
    Math.min(gpuLimitedFps, cpuLimitedFps) *
    (capacityGb > 0 && capacityGb < 16 ? Math.min(ramFactor, 0.9) : 1);

  const cpuBound = cpuLimitedFps < gpuLimitedFps * 0.97;
  const gpuBound = gpuLimitedFps < cpuLimitedFps * 0.97;

  let limitingComponent: GamingPrediction["limitingComponent"] = "balanced";
  if (cpuBound && !gpuBound) limitingComponent = "cpu";
  else if (gpuBound && !cpuBound) limitingComponent = "gpu";
  else if (capacityGb > 0 && capacityGb < 16) limitingComponent = "memory";

  const confidence =
    cpuIdx.confidence === "high" && gpuIdx.confidence === "high"
      ? "high"
      : cpuIdx.confidence === "low" || gpuIdx.confidence === "low"
        ? "low"
        : "medium";

  const gpuUtilPct = clamp(round((avgExpected / gpuLimitedFps) * 100), 45, 99);
  const cpuUtilPct = clamp(round((avgExpected / cpuLimitedFps) * 100), 35, 99);
  const spread =
    confidence === "high" ? (limitingComponent === "balanced" ? 0.08 : 0.12) : 0.18;

  const explanations = [
    `GPU profile: ${gpuIdx.label} (raster ${gpuIdx.raster}); CPU profile: ${cpuIdx.label} (ST ${cpuIdx.single}).`,
    cpuBound
      ? `${cpu.name} is the likely ceiling (~${round(cpuLimitedFps)} FPS cap).`
      : `${gpu.name} is the primary limiter for this preset.`,
  ];
  if (capacityGb > 0 && capacityGb < 16) {
    explanations.push("Under 16GB RAM applies a frame-rate penalty in this model.");
  }
  if (confidence !== "high") {
    explanations.push(
      "Lower confidence: one or more parts lack a curated benchmark profile; using conservative spec estimates.",
    );
  }
  explanations.push("Estimates only — real FPS varies with drivers, settings, and scenes.");

  return {
    avgFps: {
      low: round(avgExpected * (1 - spread)),
      expected: round(avgExpected),
      high: round(avgExpected * (1 + spread * 0.7)),
    },
    onePercentLow: round(avgExpected * (cpuBound ? 0.72 : 0.82)),
    cpuUtilPct,
    gpuUtilPct,
    limitingComponent,
    estimatedSystemWatts,
    confidence,
    explanations,
  };
}
