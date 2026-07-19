import { describe, expect, it } from "vitest";
import { getGame } from "@/data/games";
import type { CatalogPart } from "@/lib/types";
import { predictGaming } from "./gaming";

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

function gpu(name: string, vram = 12): CatalogPart {
  return {
    id: "gpu-1",
    category: "gpu",
    name,
    manufacturer: "NVIDIA",
    partNumbers: [],
    summary: "",
    tdpW: 200,
    specs: { vramGb: vram, lengthMm: 300 },
    skus: {},
  };
}

function memory(capacityGb: number, type = "DDR5", speed = 6000): CatalogPart {
  return {
    id: `ram-${capacityGb}`,
    category: "memory",
    name: `${capacityGb}GB kit`,
    manufacturer: "Test",
    partNumbers: [],
    summary: "",
    tdpW: 10,
    specs: { capacityGb, ramType: type, speedMtps: speed, modules: 2 },
    skus: {},
  };
}

function baseInput() {
  return {
    cpu: cpu("AMD Ryzen 5 7600"),
    gpu: gpu("NVIDIA GeForce RTX 4070"),
    memory: [memory(32)],
    game: getGame("cyberpunk")!,
    resolution: "1440p" as const,
    quality: "high" as const,
    estimatedSystemWatts: 350,
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
      cpu: cpu("AMD Ryzen 5 5600", 6, 12, 4.4),
      gpu: gpu("NVIDIA GeForce RTX 4090", 24),
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
      memory: [memory(8, "DDR4", 3200)],
    });
    expect(tight.avgFps.expected).toBeLessThan(with32.avgFps.expected);
    expect(tight.explanations.some((line) => /16GB/i.test(line))).toBe(true);
  });

  it("marks low confidence without curated profiles", () => {
    const result = predictGaming({
      ...baseInput(),
      cpu: cpu("Obscure CPU 9000"),
      gpu: gpu("Obscure GPU Ultra"),
    });
    expect(result.confidence).toBe("low");
  });
});
