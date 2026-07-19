# BuildPredict

PCPartPicker-style System Builder with gaming FPS and coding workload estimates.

Matrix-green dark UI. Broad offline component catalog from **BuildCores OpenDB**,
compatibility checks, curated performance overlays, and optional live retailer
pricing in the desktop app.

Ships as a Tauri desktop app for Linux, macOS, and Windows.

**Releases:** https://github.com/endergamershard-ctrl/BuildPredict/releases

> BuildPredict is **not affiliated with PCPartPicker**. There is no supported
> PCPartPicker public API; this app does **not** scrape or mirror PCPartPicker.

## Install (one-liner)

### Linux (x86_64, incl. Arch)

```sh
curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.sh | bash
```

Uninstall:

```sh
curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/uninstall.sh | bash
```

### macOS (Intel & Apple Silicon)

```sh
curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.sh | bash
```

### Windows (x64)

```powershell
irm https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.ps1 | iex
```

Windows/macOS builds are unsigned; SmartScreen/Gatekeeper may warn on first run.

## Features

- Full System Builder slots (CPU, cooler, motherboard, memory, storage, GPU, case, PSU, OS, fans, peripherals, and more)
- Offline catalog snapshot (~45k parts) derived from [BuildCores OpenDB](https://github.com/buildcores/buildcores-open-db) (ODC-By)
- Lazy category loading, search, manufacturer filters, pagination, and custom parts
- Compatibility rules: socket, RAM type/slots, case clearances, storage slots, PSU headroom
- Gaming FPS + coding workload estimates with confidence ranges
- Optional Best Buy / RetailerAPI live pricing via user-provided keys (desktop only)
- Shareable builds via URL query params (v2), with legacy `cpu/gpu/ram` migration

## Catalog & licensing

Component specs are normalized from BuildCores OpenDB and shipped under
`public/catalog/`. That database is licensed under the
[Open Data Commons Attribution License (ODC-By) v1.0](https://opendatacommons.org/licenses/by/1-0/).

Attribution: BuildCores OpenDB — https://github.com/buildcores/buildcores-open-db

Performance indices used for FPS/coding scores are curated separately in
`src/data/perf-profiles.ts`. Parts without a profile use conservative
spec-based estimates and are labeled lower confidence.

Refresh the local snapshot:

```bash
npm run catalog
```

A weekly GitHub Action (`.github/workflows/catalog.yml`) can regenerate shards
from a pinned OpenDB revision.

## Live pricing (desktop)

Open **Settings** in the app and paste your own keys:

- [Best Buy Developer API](https://developer.bestbuy.com/)
- [RetailerAPI](https://retailerapi.com/)

Keys are stored via Tauri's store plugin. Quotes match on UPC/SKU first and
show match confidence. Browser mode does not call retailer APIs; use manual
price overrides if needed.

## Stack

- Next.js (static export) + TypeScript + Tailwind CSS
- Tauri 2 desktop shell (Rust) with HTTP + store plugins
- Vitest for prediction / compatibility / URL-state tests

## Development

Requirements: Node.js 22+, Rust 1.77+, and the
[Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/).

```bash
npm install
npm run catalog        # if public/catalog is missing
npm run dev            # web
npm run tauri dev      # desktop
npm test
npm run build
npm run tauri build
```

## Prediction model

**Gaming:** GPU raster index scaled by game/resolution/quality, CPU
single-thread ceiling, RAM modifiers, wattage from selected parts.

**Coding:** multi/single-thread mix by workload, memory pressure vs preferred RAM.

Score ~100 ≈ Ryzen 5 7600 + 32GB on a mid-intensity job.

## License

MIT (application code). Catalog data retains OpenDB's ODC-By terms.
