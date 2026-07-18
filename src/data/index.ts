export { CPUS, getCpu } from "./cpus";
export { GPUS, getGpu } from "./gpus";
export { MEMORY, getMemory } from "./memory";
export {
  GAMES,
  getGame,
  RESOLUTION_SCALE,
  QUALITY_SCALE,
} from "./games";
export { WORKLOADS, getWorkload } from "./workloads";

export const DATA_PROVENANCE = {
  version: "2026.07-mvp",
  note: "Curated relative performance indices for MVP estimates. Not scraped from PCPartPicker.",
  updated: "2026-07-18",
} as const;
