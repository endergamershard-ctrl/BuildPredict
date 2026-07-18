import { describe, expect, it } from "vitest";
import { getCpu, getMemory, getWorkload } from "@/data";
import { predictCoding } from "./coding";
import { predictBuild } from "./index";

describe("predictCoding", () => {
  it("scores a 7950X higher than a 5600 on compile workloads", () => {
    const low = predictCoding({
      cpu: getCpu("r5-5600")!,
      memory: getMemory("ddr5-32-6000")!,
      workload: getWorkload("backend-compile")!,
    });
    const high = predictCoding({
      cpu: getCpu("r9-7950x")!,
      memory: getMemory("ddr5-32-6000")!,
      workload: getWorkload("backend-compile")!,
    });
    expect(high.score.expected).toBeGreaterThan(low.score.expected);
  });

  it("flags memory pressure when RAM is well below preferred", () => {
    const result = predictCoding({
      cpu: getCpu("r7-7800x3d")!,
      memory: getMemory("ddr5-16-5600")!,
      workload: getWorkload("ml-notebook")!,
    });
    expect(result.limitingComponent).toBe("memory");
    expect(result.memoryPressurePct).toBeGreaterThanOrEqual(80);
  });

  it("predictBuild returns missing slots and null gaming without a GPU", () => {
    const result = predictBuild({
      cpuId: "r5-7600",
      gpuId: null,
      memoryId: "ddr5-32-6000",
      gameId: "cyberpunk",
      workloadId: "frontend-dev",
      resolution: "1440p",
      quality: "high",
    });
    expect(result.missing).toContain("gpu");
    expect(result.gaming).toBeNull();
    expect(result.coding).not.toBeNull();
  });
});
