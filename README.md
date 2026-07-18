# BuildPredict

PCPartPicker-style System Builder with gaming FPS and coding workload estimates.

Matrix-green dark UI. Manual curated parts catalog — no PCPartPicker scraping (no public API).

## Features

- System Builder table with CPU / GPU / Memory slots
- Sortable, filterable part browser
- Gaming FPS estimates (avg + 1% low, utilization, limiter, wattage)
- Coding / workload scores (compile, tests, containers, ML, encode)
- Shareable builds via URL query params
- Transparent confidence ranges and explanations

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Vitest for pure prediction unit tests
- Local curated benchmark indices under `src/data/`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Prediction model (MVP)

Relative indices are curated for the MVP — not scraped live benchmarks.

**Gaming**

- GPU raster index scaled by game demand, resolution, and quality
- CPU single-thread index sets a frame-rate ceiling
- RAM capacity / speed applies mild modifiers
- Returns expected FPS range, 1% lows, CPU/GPU util, and limiting part

**Coding**

- Mixes multi-thread and single-thread CPU indices by workload weight
- Memory pressure rises when capacity is below the workload preference
- Score ~100 ≈ Ryzen 5 7600 + 32GB on a mid-intensity job

## Adding parts

Edit:

- `src/data/cpus.ts`
- `src/data/gpus.ts`
- `src/data/memory.ts`
- `src/data/games.ts`
- `src/data/workloads.ts`

Keep indices internally consistent with nearby parts. Bump `DATA_PROVENANCE.version` in `src/data/index.ts`.

## License

MIT
