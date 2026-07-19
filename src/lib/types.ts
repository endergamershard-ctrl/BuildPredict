import type { CategoryId } from "@/lib/categories";

export type { CategoryId };
export type Resolution = "1080p" | "1440p" | "4k";
export type QualityPreset = "medium" | "high" | "ultra";

/** Compact catalog part used by the UI and rules engine. */
export interface CatalogPart {
  id: string;
  category: CategoryId;
  name: string;
  manufacturer: string;
  series?: string;
  variant?: string;
  partNumbers: string[];
  /** One-line key specs for tables */
  summary: string;
  /** Estimated thermal / board power draw when known */
  tdpW?: number;
  /** PSU rated wattage */
  wattage?: number;
  /** Category-specific fields used by compatibility / prediction */
  specs: Record<string, unknown>;
  skus: {
    amazon?: string;
    newegg?: string;
    bestbuy?: string;
    walmart?: string;
    upc?: string;
  };
  /** User-entered part not from OpenDB */
  custom?: boolean;
}

export interface CatalogManifest {
  version: string;
  source: string;
  sourceRevision: string;
  license: string;
  attribution: string;
  updated: string;
  categories: Array<{
    id: CategoryId;
    openDb: string;
    count: number;
    file: string;
  }>;
}

export interface GameTitle {
  id: string;
  name: string;
  gpuDemand: number;
  cpuDemand: number;
  year: number;
}

export interface CodingWorkload {
  id: string;
  name: string;
  description: string;
  multiThreadWeight: number;
  intensity: number;
  preferredRamGb: number;
}

/** Selected part IDs per category (arrays for multi-slot categories). */
export type PartSlots = Partial<Record<CategoryId, string[]>>;

export interface CustomPartEntry {
  id: string;
  part: CatalogPart;
}

export interface BuildSelection {
  /** Catalog / custom part IDs keyed by category */
  parts: PartSlots;
  /** Inline custom parts keyed by id */
  customParts: Record<string, CatalogPart>;
  /** Manual price overrides keyed by part id (USD) */
  priceOverrides: Record<string, number>;
  gameId: string;
  workloadId: string;
  resolution: Resolution;
  quality: QualityPreset;
  /** Show peripheral / extras rows in the builder */
  showExtras: boolean;
}

export interface ConfidenceRange {
  low: number;
  expected: number;
  high: number;
}

export type CompatSeverity = "error" | "warning" | "info" | "unknown";

export interface CompatIssue {
  severity: CompatSeverity;
  code: string;
  message: string;
  categories: CategoryId[];
}

export interface CompatibilityReport {
  issues: CompatIssue[];
  estimatedWatts: number;
  hardErrors: number;
  warnings: number;
}

export interface GamingPrediction {
  avgFps: ConfidenceRange;
  onePercentLow: number;
  cpuUtilPct: number;
  gpuUtilPct: number;
  limitingComponent: CategoryId | "balanced";
  estimatedSystemWatts: number;
  confidence: "high" | "medium" | "low";
  explanations: string[];
}

export interface CodingPrediction {
  score: ConfidenceRange;
  estimatedCpuLoadPct: number;
  memoryPressurePct: number;
  relativeToBaseline: number;
  limitingComponent: "cpu" | "memory" | "balanced";
  confidence: "high" | "medium" | "low";
  explanations: string[];
}

export interface PriceQuote {
  partId: string;
  provider: "bestbuy" | "retailerapi" | "manual";
  retailer: string;
  price: number;
  currency: string;
  inStock?: boolean;
  url?: string;
  matchConfidence: "exact" | "sku" | "name" | "manual";
  fetchedAt: string;
}

export interface PredictionResult {
  gaming: GamingPrediction | null;
  coding: CodingPrediction | null;
  missing: CategoryId[];
  compatibility: CompatibilityReport;
  totalManualPrice: number | null;
}

/** Curated performance profile overlay for known CPUs/GPUs */
export interface CpuPerfProfile {
  id: string;
  match: string[];
  singleThreadIndex: number;
  multiThreadIndex: number;
  tdpW: number;
}

export interface GpuPerfProfile {
  id: string;
  match: string[];
  rasterIndex: number;
  tdpW: number;
  vramGb: number;
  tier: "entry" | "mid" | "high" | "enthusiast";
}
