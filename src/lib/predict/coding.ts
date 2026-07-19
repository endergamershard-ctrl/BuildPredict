import { matchCpuProfile } from "@/data/perf-profiles";
import type {
  CatalogPart,
  CodingPrediction,
  CodingWorkload,
} from "@/lib/types";

const REFERENCE_MULTI = 175;
const REFERENCE_SINGLE = 148;

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
      confidence: "high" as const,
    };
  }
  const cores = Number(cpu.specs.cores) || 6;
  const threads = Number(cpu.specs.threads) || cores;
  const boost = Number(cpu.specs.boostGhz) || 4.0;
  const single = Math.round(80 + boost * 12 + Math.min(cores, 8) * 2);
  const multi = Math.round(single * (0.55 + threads / 20));
  return { single, multi, confidence: "low" as const };
}

export function predictCoding(input: {
  cpu: CatalogPart;
  memory: CatalogPart[];
  workload: CodingWorkload;
}): CodingPrediction {
  const { cpu, memory, workload } = input;
  const cpuIdx = cpuIndexes(cpu);
  const capacityGb = memory.reduce(
    (sum, kit) => sum + (Number(kit.specs.capacityGb) || 0),
    0,
  );
  const maxSpeed = Math.max(
    0,
    ...memory.map((kit) => Number(kit.specs.speedMtps) || 0),
  );

  const multiContribution =
    (cpuIdx.multi / REFERENCE_MULTI) * workload.multiThreadWeight;
  const singleContribution =
    (cpuIdx.single / REFERENCE_SINGLE) * (1 - workload.multiThreadWeight);

  let cpuScore = (multiContribution + singleContribution) * 100;
  cpuScore *= 100 / workload.intensity;

  const ramRatio =
    capacityGb > 0 ? capacityGb / workload.preferredRamGb : 0.5;
  let memoryFactor = 1;
  let memoryPressurePct = 40;

  if (ramRatio < 0.6) {
    memoryFactor = 0.7;
    memoryPressurePct = 95;
  } else if (ramRatio < 0.85) {
    memoryFactor = 0.88;
    memoryPressurePct = 80;
  } else if (ramRatio < 1) {
    memoryFactor = 0.95;
    memoryPressurePct = 65;
  } else if (ramRatio >= 1.5) {
    memoryFactor = 1.04;
    memoryPressurePct = 30;
  } else {
    memoryPressurePct = 45;
  }

  if (maxSpeed >= 6000) memoryFactor *= 1.02;

  const expected = cpuScore * memoryFactor;
  const estimatedCpuLoadPct = clamp(
    round(workload.intensity * 0.55 + workload.multiThreadWeight * 35),
    35,
    98,
  );

  let limitingComponent: CodingPrediction["limitingComponent"] = "balanced";
  if (memoryPressurePct >= 80) limitingComponent = "memory";
  else if (estimatedCpuLoadPct >= 85) limitingComponent = "cpu";

  const confidence = cpuIdx.confidence;
  const spread = confidence === "high" ? (limitingComponent === "balanced" ? 0.07 : 0.11) : 0.16;

  const explanations = [
    `${workload.name} weights multi-thread at ${Math.round(workload.multiThreadWeight * 100)}%.`,
    `${cpu.name} multi-thread index ~${cpuIdx.multi} drives most of the score.`,
  ];
  if (memoryPressurePct >= 80) {
    explanations.push(
      `${capacityGb || "?"}GB is below the preferred ${workload.preferredRamGb}GB for this workload.`,
    );
  } else {
    explanations.push(
      `${capacityGb || "?"}GB memory looks sufficient for this task.`,
    );
  }
  if (confidence !== "high") {
    explanations.push(
      "Lower confidence: CPU lacks a curated benchmark profile; using conservative spec estimates.",
    );
  }
  explanations.push("Score is relative (100 ≈ Ryzen 5 7600 + 32GB on a mid-intensity job).");

  return {
    score: {
      low: round(expected * (1 - spread)),
      expected: round(expected),
      high: round(expected * (1 + spread * 0.75)),
    },
    estimatedCpuLoadPct,
    memoryPressurePct,
    relativeToBaseline: round(expected),
    limitingComponent,
    confidence,
    explanations,
  };
}
