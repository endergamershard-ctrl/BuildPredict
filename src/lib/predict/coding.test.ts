import { describe, expect, it } from "vitest";
import { getWorkload } from "@/data/workloads";
import type { CatalogPart } from "@/lib/types";
import { predictCoding } from "./coding";
import { predictBuildFromParts } from "./index";
import { DEFAULT_SELECTION } from "@/lib/build-state";

function cpu(name: string, cores = 6, threads = 12, boost = 5.1): CatalogPart {
  return {
    id: "cpu-1",
    category: "cpu",
    name,
    manufacturer: "AMD",
    partNumbers: [],
    summary: "",
    tdpW: 65,
    specs: { cores, threads, boostGhz: boost, socket: "AM5" },
    skus: {},
  };
}

function memory(capacityGb: number): CatalogPart {
  return {
    id: `ram-${capacityGb}`,
    category: "memory",
    name: `${capacityGb}GB`,
    manufacturer: "Test",
    partNumbers: [],
    summary: "",
    specs: { capacityGb, ramType: "DDR5", speedMtps: 6000, modules: 2 },
    skus: {},
  };
}

describe("predictCoding", () => {
  it("scores a 7950X higher than a 5600 on compile workloads", () => {
    const low = predictCoding({
      cpu: cpu("AMD Ryzen 5 5600"),
      memory: [memory(32)],
      workload: getWorkload("backend-compile")!,
    });
    const high = predictCoding({
      cpu: cpu("AMD Ryzen 9 7950X", 16, 32, 5.7),
      memory: [memory(32)],
      workload: getWorkload("backend-compile")!,
    });
    expect(high.score.expected).toBeGreaterThan(low.score.expected);
  });

  it("flags memory pressure when RAM is well below preferred", () => {
    const result = predictCoding({
      cpu: cpu("AMD Ryzen 7 7800X3D", 8, 16, 5.0),
      memory: [memory(16)],
      workload: getWorkload("ml-notebook")!,
    });
    expect(result.limitingComponent).toBe("memory");
    expect(result.memoryPressurePct).toBeGreaterThanOrEqual(80);
  });

  it("predictBuildFromParts returns missing slots without a GPU", () => {
    const result = predictBuildFromParts(
      {
        ...DEFAULT_SELECTION,
        parts: { cpu: ["cpu-1"], memory: ["ram-32"] },
      },
      {
        cpu: cpu("AMD Ryzen 5 7600"),
        memory: [memory(32)],
        storage: [],
      },
    );
    expect(result.missing).toContain("gpu");
    expect(result.gaming).toBeNull();
    expect(result.coding).not.toBeNull();
  });
});
