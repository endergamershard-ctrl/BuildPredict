import type {
  CodingPrediction,
  CodingWorkload,
  CpuPart,
  MemoryPart,
} from "@/lib/types";

const REFERENCE_MULTI = 175;
const REFERENCE_SINGLE = 148;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

export function predictCoding(input: {
  cpu: CpuPart;
  memory: MemoryPart;
  workload: CodingWorkload;
}): CodingPrediction {
  const { cpu, memory, workload } = input;

  const multiContribution =
    (cpu.multiThreadIndex / REFERENCE_MULTI) * workload.multiThreadWeight;
  const singleContribution =
    (cpu.singleThreadIndex / REFERENCE_SINGLE) *
    (1 - workload.multiThreadWeight);

  let cpuScore = (multiContribution + singleContribution) * 100;
  cpuScore *= 100 / workload.intensity;

  const ramRatio = memory.capacityGb / workload.preferredRamGb;
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

  if (memory.speedMtps >= 6000) {
    memoryFactor *= 1.02;
  }

  const expected = cpuScore * memoryFactor;
  const estimatedCpuLoadPct = clamp(
    round(workload.intensity * 0.55 + workload.multiThreadWeight * 35),
    35,
    98,
  );

  let limitingComponent: CodingPrediction["limitingComponent"] = "balanced";
  if (memoryPressurePct >= 80) limitingComponent = "memory";
  else if (estimatedCpuLoadPct >= 85) limitingComponent = "cpu";

  const spread = limitingComponent === "balanced" ? 0.07 : 0.11;
  const score = {
    low: round(expected * (1 - spread)),
    expected: round(expected),
    high: round(expected * (1 + spread * 0.75)),
  };

  const explanations: string[] = [
    `${workload.name} weights multi-thread at ${Math.round(workload.multiThreadWeight * 100)}%.`,
    `${cpu.name} multi-thread index ${cpu.multiThreadIndex} drives most of the score.`,
  ];

  if (memoryPressurePct >= 80) {
    explanations.push(
      `${memory.capacityGb}GB is below the preferred ${workload.preferredRamGb}GB for this workload.`,
    );
  } else {
    explanations.push(
      `${memory.capacityGb}GB ${memory.type}-${memory.speedMtps} looks sufficient for this task.`,
    );
  }
  explanations.push("Score is relative (100 ≈ Ryzen 5 7600 + 32GB on a mid-intensity job).");

  return {
    score,
    estimatedCpuLoadPct,
    memoryPressurePct,
    relativeToBaseline: round(expected),
    limitingComponent,
    explanations,
  };
}
