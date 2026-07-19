import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTION } from "@/lib/build-state";
import type { CatalogPart } from "@/lib/types";
import { evaluateCompatibility } from "./index";

function part(
  category: CatalogPart["category"],
  name: string,
  specs: Record<string, unknown>,
  extra: Partial<CatalogPart> = {},
): CatalogPart {
  return {
    id: `${category}-${name}`,
    category,
    name,
    manufacturer: "Test",
    partNumbers: [],
    summary: "",
    specs,
    skus: {},
    ...extra,
  };
}

describe("evaluateCompatibility", () => {
  it("detects CPU/motherboard socket mismatch", () => {
    const report = evaluateCompatibility({
      selection: DEFAULT_SELECTION,
      cpu: part("cpu", "CPU", { socket: "AM5", cores: 6, threads: 12 }, { tdpW: 65 }),
      motherboard: part("motherboard", "Board", {
        socket: "LGA 1700",
        formFactor: "ATX",
        ramType: "DDR5",
        ramSlots: 4,
        ramMaxGb: 128,
      }),
      memory: [],
      storage: [],
    });
    expect(report.hardErrors).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.code === "socket-mismatch")).toBe(true);
  });

  it("flags underpowered PSU", () => {
    const report = evaluateCompatibility({
      selection: DEFAULT_SELECTION,
      cpu: part("cpu", "CPU", { socket: "AM5" }, { tdpW: 120 }),
      gpu: part("gpu", "GPU", { lengthMm: 300, vramGb: 16 }, { tdpW: 450 }),
      memory: [part("memory", "RAM", { capacityGb: 32, modules: 2 }, { tdpW: 10 })],
      storage: [],
      psu: part("psu", "PSU", { wattage: 450 }, { wattage: 450 }),
    });
    expect(report.issues.some((i) => i.code === "psu-underpowered")).toBe(true);
  });

  it("accepts matching AM5 + DDR5 board", () => {
    const report = evaluateCompatibility({
      selection: DEFAULT_SELECTION,
      cpu: part("cpu", "CPU", { socket: "AM5" }, { tdpW: 65 }),
      motherboard: part("motherboard", "Board", {
        socket: "AM5",
        formFactor: "ATX",
        ramType: "DDR5",
        ramSlots: 4,
        ramMaxGb: 192,
        sataPorts: 4,
        m2Slots: 2,
      }),
      memory: [
        part("memory", "RAM", {
          capacityGb: 32,
          modules: 2,
          ramType: "DDR5",
          speedMtps: 6000,
        }),
      ],
      storage: [],
      pcCase: part("case", "Case", {
        motherboardFormFactors: ["ATX", "Micro ATX", "Mini-ITX"],
        maxGpuLengthMm: 400,
        maxCoolerHeightMm: 170,
      }),
      psu: part("psu", "PSU", { wattage: 750, connectors: { pcie62: 3 } }, { wattage: 750 }),
    });
    expect(report.hardErrors).toBe(0);
  });
});
