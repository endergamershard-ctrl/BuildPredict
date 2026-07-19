export { GAMES, getGame, RESOLUTION_SCALE, QUALITY_SCALE } from "./games";
export { WORKLOADS, getWorkload } from "./workloads";
export {
  CPU_PROFILES,
  GPU_PROFILES,
  matchCpuProfile,
  matchGpuProfile,
} from "./perf-profiles";
import revision from "./catalog-revision.json";

export const DATA_PROVENANCE = {
  version: "2026.07-opendb",
  note: "Component catalog derived from BuildCores OpenDB (ODC-By). Performance indices are curated separately. Not scraped from PCPartPicker.",
  updated: revision.updated,
  sourceRevision: revision.revision,
  totalParts: revision.totalParts,
} as const;
