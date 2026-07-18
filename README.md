# BuildPredict

PCPartPicker-style System Builder with gaming FPS and coding workload estimates.

Matrix-green dark UI. Manual curated parts catalog — no PCPartPicker scraping (no public API).

Ships as a desktop app (Tauri) for Linux, macOS, and Windows.

**Releases:** https://github.com/endergamershard-ctrl/BuildPredict/releases

## Install (one-liner)

### Linux (x86_64, incl. Arch)

```sh
curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.sh | bash
```

Installs the binary to `~/.local/bin`, a desktop entry, and an icon. Launch from
your app menu or run `buildpredict`.

Uninstall:

```sh
curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/uninstall.sh | bash
```

### macOS (Intel & Apple Silicon)

```sh
curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.sh | bash
```

Installs `BuildPredict.app` to `/Applications`. Builds are unsigned — on first
launch, right-click the app and choose **Open**.

### Windows (x64)

In PowerShell:

```powershell
irm https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.ps1 | iex
```

Downloads and runs the latest NSIS installer. Launch **BuildPredict** from the
Start Menu.

> Windows builds are unsigned. SmartScreen may warn on first run — choose
> **More info → Run anyway**. WebView2 Runtime is required (preinstalled on
> most Windows 10/11 systems).

## Features

- System Builder table with CPU / GPU / Memory slots
- Sortable, filterable part browser
- Gaming FPS estimates (avg + 1% low, utilization, limiter, wattage)
- Coding / workload scores (compile, tests, containers, ML, encode)
- Shareable builds via URL query params
- Transparent confidence ranges and explanations

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS, statically exported
- Tauri 2 desktop shell (Rust)
- Vitest for pure prediction unit tests
- Local curated benchmark indices under `src/data/`

## Development

Requirements: Node.js 22+, Rust 1.77+, and the [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/).

```bash
npm install
npm run dev          # web dev server at http://localhost:3000
npm run tauri dev    # desktop app with hot reload
```

```bash
npm test             # prediction unit tests
npm run build        # static web export to out/
npm run tauri build  # desktop release build
```

Releases are built by GitHub Actions on version tags (`v*`): a portable Linux
tarball, macOS DMGs for both architectures, and a Windows NSIS installer.

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
