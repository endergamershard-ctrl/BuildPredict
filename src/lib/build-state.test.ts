import { describe, expect, it } from "vitest";
import {
  selectionFromSearchParams,
  selectionToSearchParams,
  DEFAULT_SELECTION,
} from "./build-state";

describe("build-state URL serialization", () => {
  it("round-trips a multi-category selection", () => {
    const selection = {
      ...DEFAULT_SELECTION,
      parts: {
        cpu: ["cpu-1"],
        gpu: ["gpu-1"],
        memory: ["ram-1", "ram-2"],
        storage: ["ssd-1"],
      },
      showExtras: true,
    };
    const params = new URLSearchParams(selectionToSearchParams(selection));
    const restored = selectionFromSearchParams(params);
    expect(restored.parts.cpu).toEqual(["cpu-1"]);
    expect(restored.parts.memory).toEqual(["ram-1", "ram-2"]);
    expect(restored.parts.storage).toEqual(["ssd-1"]);
    expect(restored.showExtras).toBe(true);
  });

  it("migrates legacy cpu/gpu/ram query params", () => {
    const params = new URLSearchParams("cpu=old-cpu&gpu=old-gpu&ram=old-ram");
    const restored = selectionFromSearchParams(params);
    expect(restored.parts.cpu).toEqual(["old-cpu"]);
    expect(restored.parts.gpu).toEqual(["old-gpu"]);
    expect(restored.parts.memory).toEqual(["old-ram"]);
  });
});
