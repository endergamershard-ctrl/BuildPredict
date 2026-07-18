import type { CodingWorkload } from "@/lib/types";

export const WORKLOADS: CodingWorkload[] = [
  {
    id: "frontend-dev",
    name: "Frontend Dev (Vite/Next)",
    description: "Hot reload, TypeScript checks, light bundling",
    multiThreadWeight: 0.35,
    intensity: 70,
    preferredRamGb: 16,
  },
  {
    id: "backend-compile",
    name: "Backend Compile (Go/Rust/C++)",
    description: "Parallel compile of a mid-size codebase",
    multiThreadWeight: 0.85,
    intensity: 120,
    preferredRamGb: 32,
  },
  {
    id: "test-suite",
    name: "CI Test Suite",
    description: "Unit + integration tests with moderate parallelism",
    multiThreadWeight: 0.7,
    intensity: 100,
    preferredRamGb: 24,
  },
  {
    id: "containers",
    name: "Docker / K8s Local",
    description: "Multiple containers, image builds, and services",
    multiThreadWeight: 0.6,
    intensity: 110,
    preferredRamGb: 32,
  },
  {
    id: "ml-notebook",
    name: "ML Notebooks (CPU)",
    description: "Pandas/NumPy transforms and model training on CPU",
    multiThreadWeight: 0.75,
    intensity: 130,
    preferredRamGb: 48,
  },
  {
    id: "video-encode",
    name: "Local Video Encode",
    description: "Software encode of 1080p footage",
    multiThreadWeight: 0.9,
    intensity: 140,
    preferredRamGb: 32,
  },
];

export function getWorkload(id: string): CodingWorkload | undefined {
  return WORKLOADS.find((workload) => workload.id === id);
}
