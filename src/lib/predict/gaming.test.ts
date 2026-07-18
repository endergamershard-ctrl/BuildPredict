import { describe, expect, it } from "vitest";
import { getCpu, getGame, getGpu, getMemory } from "@/data";
import { predictGaming } from "./gaming";

function baseInput() {
  return {
    cpu: getCpu("r5-7600")!,
    gpu: getGpu("rtx-4070")!,
    memory: getMemory("ddr5-32-6000")!,
    game: getGame("cyberpunk")!,
    resolution: "1440p" as const,
    quality: "high" as const,
  };
}

describe("predictGaming", () => {
  it("returns higher FPS at 1080p than 4k for the same build", () => {
    const at1080 = predictGaming({ ...baseInput(), resolution: "1080p" });
    const at4k = predictGaming({ ...baseInput(), resolution: "4k" });
    expect(at1080.avgFps.expected).toBeGreaterThan(at4k.avgFps.expected);
  });

  it("flags CPU as limiter for CPU-heavy titles on a strong GPU", () => {
    const result = predictGaming({
      ...baseInput(),
      cpu: getCpu("r5-5600")!,
      gpu: getGpu("rtx-4090")!,
      game: getGame("cs2")!,
      resolution: "1080p",
      quality: "medium",
    });
    expect(result.limitingComponent).toBe("cpu");
    expect(result.onePercentLow).toBeLessThan(result.avgFps.expected);
  });

  it("applies a low-RAM penalty under 16GB", () => {
    const with32 = predictGaming(baseInput());
    const tight = predictGaming({
      ...baseInput(),
      memory: {
        ...getMemory("ddr4-16-3200")!,
        capacityGb: 8,
        name: "8GB test",
      },
    });
    expect(tight.avgFps.expected).toBeLessThan(with32.avgFps.expected);
    expect(tight.explanations.some((line) => /16GB/i.test(line))).toBe(true);
  });

  it("includes confidence bounds around the expected FPS", () => {
    const result = predictGaming(baseInput());
    expect(result.avgFps.low).toBeLessThan(result.avgFps.expected);
    expect(result.avgFps.high).toBeGreaterThan(result.avgFps.expected);
    expect(result.estimatedSystemWatts).toBeGreaterThan(100);
  });
});
