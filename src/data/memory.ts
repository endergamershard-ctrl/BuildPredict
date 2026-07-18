import type { MemoryPart } from "@/lib/types";

/** Curated memory kits used by the MVP configurator. */
export const MEMORY: MemoryPart[] = [
  {
    id: "ddr4-16-3200",
    name: "16GB (2x8) DDR4-3200",
    capacityGb: 16,
    speedMtps: 3200,
    type: "DDR4",
    modules: "2x8GB",
    tdpW: 8,
  },
  {
    id: "ddr4-32-3600",
    name: "32GB (2x16) DDR4-3600",
    capacityGb: 32,
    speedMtps: 3600,
    type: "DDR4",
    modules: "2x16GB",
    tdpW: 10,
  },
  {
    id: "ddr5-16-5600",
    name: "16GB (2x8) DDR5-5600",
    capacityGb: 16,
    speedMtps: 5600,
    type: "DDR5",
    modules: "2x8GB",
    tdpW: 10,
  },
  {
    id: "ddr5-32-6000",
    name: "32GB (2x16) DDR5-6000",
    capacityGb: 32,
    speedMtps: 6000,
    type: "DDR5",
    modules: "2x16GB",
    tdpW: 12,
  },
  {
    id: "ddr5-64-6000",
    name: "64GB (2x32) DDR5-6000",
    capacityGb: 64,
    speedMtps: 6000,
    type: "DDR5",
    modules: "2x32GB",
    tdpW: 16,
  },
  {
    id: "ddr5-96-6400",
    name: "96GB (2x48) DDR5-6400",
    capacityGb: 96,
    speedMtps: 6400,
    type: "DDR5",
    modules: "2x48GB",
    tdpW: 20,
  },
];

export function getMemory(id: string): MemoryPart | undefined {
  return MEMORY.find((kit) => kit.id === id);
}
