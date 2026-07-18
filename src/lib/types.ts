export type ComponentCategory = "cpu" | "gpu" | "memory";

export type Resolution = "1080p" | "1440p" | "4k";
export type QualityPreset = "medium" | "high" | "ultra";

export interface CpuPart {
  id: string;
  name: string;
  brand: "AMD" | "Intel";
  cores: number;
  threads: number;
  boostGhz: number;
  tdpW: number;
  /** Relative single-thread index used for gaming CPU caps */
  singleThreadIndex: number;
  /** Relative multi-thread index used for coding workloads */
  multiThreadIndex: number;
  socket: string;
}

export interface GpuPart {
  id: string;
  name: string;
  brand: "NVIDIA" | "AMD" | "Intel";
  vramGb: number;
  tdpW: number;
  /** Relative raster performance index at 1080p Ultra */
  rasterIndex: number;
  tier: "entry" | "mid" | "high" | "enthusiast";
}

export interface MemoryPart {
  id: string;
  name: string;
  capacityGb: number;
  speedMtps: number;
  type: "DDR4" | "DDR5";
  modules: string;
  tdpW: number;
}

export interface GameTitle {
  id: string;
  name: string;
  /** Relative GPU demand vs a 100 baseline title */
  gpuDemand: number;
  /** Relative CPU demand vs a 100 baseline title */
  cpuDemand: number;
  year: number;
}

export interface CodingWorkload {
  id: string;
  name: string;
  description: string;
  /** Weight of multi-thread CPU for this workload (0-1) */
  multiThreadWeight: number;
  /** Relative intensity vs a 100 baseline */
  intensity: number;
  /** Preferred RAM in GB before memory pressure rises */
  preferredRamGb: number;
}

export interface BuildSelection {
  cpuId: string | null;
  gpuId: string | null;
  memoryId: string | null;
  gameId: string;
  workloadId: string;
  resolution: Resolution;
  quality: QualityPreset;
}

export interface ConfidenceRange {
  low: number;
  expected: number;
  high: number;
}

export interface GamingPrediction {
  avgFps: ConfidenceRange;
  onePercentLow: number;
  cpuUtilPct: number;
  gpuUtilPct: number;
  limitingComponent: ComponentCategory | "balanced";
  estimatedSystemWatts: number;
  explanations: string[];
}

export interface CodingPrediction {
  score: ConfidenceRange;
  estimatedCpuLoadPct: number;
  memoryPressurePct: number;
  relativeToBaseline: number;
  limitingComponent: "cpu" | "memory" | "balanced";
  explanations: string[];
}

export interface PredictionResult {
  gaming: GamingPrediction | null;
  coding: CodingPrediction | null;
  missing: ComponentCategory[];
}
