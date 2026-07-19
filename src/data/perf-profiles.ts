import type { CpuPerfProfile, GpuPerfProfile } from "@/lib/types";

/** Curated relative indices used when a catalog name matches. */
export const CPU_PROFILES: CpuPerfProfile[] = [
  { id: "r5-5600", match: ["ryzen 5 5600"], singleThreadIndex: 118, multiThreadIndex: 140, tdpW: 65 },
  { id: "r5-7600", match: ["ryzen 5 7600"], singleThreadIndex: 148, multiThreadIndex: 175, tdpW: 65 },
  { id: "r7-5800x3d", match: ["ryzen 7 5800x3d"], singleThreadIndex: 132, multiThreadIndex: 185, tdpW: 105 },
  { id: "r7-7800x3d", match: ["ryzen 7 7800x3d"], singleThreadIndex: 155, multiThreadIndex: 210, tdpW: 120 },
  { id: "r9-7950x", match: ["ryzen 9 7950x"], singleThreadIndex: 160, multiThreadIndex: 340, tdpW: 170 },
  { id: "i5-12400f", match: ["i5-12400f", "core i5-12400f"], singleThreadIndex: 122, multiThreadIndex: 145, tdpW: 65 },
  { id: "i5-14600k", match: ["i5-14600k", "core i5-14600k"], singleThreadIndex: 152, multiThreadIndex: 245, tdpW: 125 },
  { id: "i7-14700k", match: ["i7-14700k", "core i7-14700k"], singleThreadIndex: 158, multiThreadIndex: 300, tdpW: 125 },
  { id: "i9-14900k", match: ["i9-14900k", "core i9-14900k"], singleThreadIndex: 165, multiThreadIndex: 355, tdpW: 125 },
];

export const GPU_PROFILES: GpuPerfProfile[] = [
  { id: "rtx-4090", match: ["rtx 4090"], rasterIndex: 300, tdpW: 450, vramGb: 24, tier: "enthusiast" },
  { id: "rtx-4080-super", match: ["rtx 4080 super", "rtx 4080"], rasterIndex: 240, tdpW: 320, vramGb: 16, tier: "enthusiast" },
  { id: "rtx-4070-ti-super", match: ["rtx 4070 ti super"], rasterIndex: 195, tdpW: 285, vramGb: 16, tier: "high" },
  { id: "rtx-4070-ti", match: ["rtx 4070 ti"], rasterIndex: 180, tdpW: 285, vramGb: 12, tier: "high" },
  { id: "rtx-4070", match: ["rtx 4070"], rasterIndex: 160, tdpW: 200, vramGb: 12, tier: "high" },
  { id: "rtx-4060", match: ["rtx 4060"], rasterIndex: 115, tdpW: 115, vramGb: 8, tier: "mid" },
  { id: "rtx-3060", match: ["rtx 3060"], rasterIndex: 100, tdpW: 170, vramGb: 12, tier: "mid" },
  { id: "rx-7900-xtx", match: ["rx 7900 xtx"], rasterIndex: 255, tdpW: 355, vramGb: 24, tier: "enthusiast" },
  { id: "rx-7800-xt", match: ["rx 7800 xt"], rasterIndex: 185, tdpW: 263, vramGb: 16, tier: "high" },
  { id: "rx-7600", match: ["rx 7600"], rasterIndex: 120, tdpW: 165, vramGb: 8, tier: "mid" },
  { id: "rx-6600", match: ["rx 6600"], rasterIndex: 95, tdpW: 132, vramGb: 8, tier: "mid" },
  { id: "arc-b580", match: ["arc b580"], rasterIndex: 110, tdpW: 190, vramGb: 12, tier: "mid" },
];

export function matchCpuProfile(name: string): CpuPerfProfile | undefined {
  const n = name.toLowerCase();
  return CPU_PROFILES.find((p) => p.match.some((m) => n.includes(m)));
}

export function matchGpuProfile(name: string): GpuPerfProfile | undefined {
  const n = name.toLowerCase();
  const sorted = [...GPU_PROFILES].sort(
    (a, b) =>
      Math.max(...b.match.map((m) => m.length)) -
      Math.max(...a.match.map((m) => m.length)),
  );
  return sorted.find((p) => p.match.some((m) => n.includes(m)));
}
