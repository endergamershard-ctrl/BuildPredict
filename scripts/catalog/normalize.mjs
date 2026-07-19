#!/usr/bin/env node
/**
 * Download a pinned BuildCores OpenDB revision and emit compact category shards
 * into public/catalog/. ODC-By attribution is preserved in the manifest.
 *
 * Usage:
 *   node scripts/catalog/normalize.mjs
 *   OPENDB_REF=<sha|tag|branch> node scripts/catalog/normalize.mjs
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const OUT = join(ROOT, "public/catalog");
const CACHE = join(ROOT, ".cache/buildcores-open-db");
const REPO = "https://github.com/buildcores/buildcores-open-db.git";
const REF = process.env.OPENDB_REF || "0cf5d575d23dc7b61c91e6350c67f90a38e1dad2";

const CATEGORIES = [
  ["cpu", "CPU"],
  ["cpu-cooler", "CPUCooler"],
  ["motherboard", "Motherboard"],
  ["memory", "RAM"],
  ["storage", "Storage"],
  ["gpu", "GPU"],
  ["case", "PCCase"],
  ["psu", "PSU"],
  ["os", "OS"],
  ["case-fan", "CaseFan"],
  ["thermal-compound", "ThermalCompound"],
  ["monitor", "Monitor"],
  ["capture-card", "CaptureCard"],
  ["network-card", "NetworkCard"],
  ["sound-card", "SoundCard"],
  ["keyboard", "Keyboard"],
  ["mouse", "Mouse"],
  ["headphones", "Headphones"],
  ["speakers", "Speaker"],
  ["microphone", "Microphone"],
  ["webcam", "Webcam"],
  ["lighting", "Lighting"],
  ["accessory", "Accessory"],
];

function ensureRepo() {
  mkdirSync(dirname(CACHE), { recursive: true });
  if (!existsSync(join(CACHE, ".git"))) {
    console.log(`Cloning OpenDB (shallow) into ${CACHE}…`);
    execFileSync(
      "git",
      ["clone", "--filter=blob:none", "--sparse", REPO, CACHE],
      { stdio: "inherit" },
    );
    execFileSync("git", ["-C", CACHE, "sparse-checkout", "set", "open-db"], {
      stdio: "inherit",
    });
  }
  console.log(`Checking out ${REF}…`);
  execFileSync("git", ["-C", CACHE, "fetch", "--depth", "1", "origin", REF], {
    stdio: "inherit",
  });
  try {
    execFileSync("git", ["-C", CACHE, "checkout", "--force", "FETCH_HEAD"], {
      stdio: "inherit",
    });
  } catch {
    execFileSync("git", ["-C", CACHE, "checkout", "--force", REF], {
      stdio: "inherit",
    });
  }
  return execFileSync("git", ["-C", CACHE, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
}

function num(v, fallback = undefined) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function pickSkus(raw) {
  const g = raw.general_product_information || {};
  const skus = {};
  if (g.amazon_sku) skus.amazon = String(g.amazon_sku);
  if (g.newegg_sku) skus.newegg = String(g.newegg_sku);
  if (g.bestbuy_sku != null) skus.bestbuy = String(g.bestbuy_sku);
  if (g.walmart_sku != null) skus.walmart = String(g.walmart_sku);
  if (g.upc) skus.upc = String(g.upc);
  return skus;
}

function base(raw, category) {
  const meta = raw.metadata || {};
  return {
    id: str(raw.opendb_id || meta.opendb_id),
    category,
    name: str(meta.name || "Unknown"),
    manufacturer: str(meta.manufacturer || "Unknown"),
    series: meta.series ? str(meta.series) : undefined,
    variant: meta.variant ? str(meta.variant) : undefined,
    partNumbers: Array.isArray(meta.part_numbers)
      ? meta.part_numbers.map(String)
      : [],
    skus: pickSkus(raw),
  };
}

function normalizeCpu(raw) {
  const b = base(raw, "cpu");
  const cores = raw.cores || {};
  const clocks = raw.clocks?.performance || {};
  const tdp = num(raw.specifications?.tdp);
  const socket = str(raw.socket);
  const memoryTypes = raw.specifications?.memory?.types || [];
  return {
    ...b,
    tdpW: tdp,
    summary: [
      `${cores.total || "?"}C/${cores.threads || "?"}T`,
      clocks.boost ? `${clocks.boost} GHz` : null,
      socket,
      tdp != null ? `${tdp}W` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      socket,
      cores: num(cores.total),
      threads: num(cores.threads),
      boostGhz: num(clocks.boost),
      baseGhz: num(clocks.base),
      memoryTypes,
      includesCooler: Boolean(raw.specifications?.includesCooler),
    },
  };
}

function normalizeGpu(raw) {
  const b = base(raw, "gpu");
  const vram = num(raw.memory);
  const tdp = num(raw.tdp ?? raw.board_power);
  const length = num(raw.length);
  const chipset = str(raw.chipset);
  const brand = str(raw.chipset_manufacturer);
  const connectors = raw.power_connectors || {};
  return {
    ...b,
    tdpW: tdp,
    summary: [
      chipset || b.name,
      vram != null ? `${vram}GB` : null,
      tdp != null ? `${tdp}W` : null,
      length != null ? `${length}mm` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      chipset,
      brand,
      vramGb: vram,
      lengthMm: length,
      interface: str(raw.interface),
      powerConnectors: {
        pcie6: num(connectors.pcie_6_pin, 0),
        pcie8: num(connectors.pcie_8_pin, 0),
        pcie12VHPWR: num(connectors.pcie_12VHPWR, 0),
        pcie12V2x6: num(connectors.pcie_12V_2x6, 0),
      },
    },
  };
}

function normalizeMotherboard(raw) {
  const b = base(raw, "motherboard");
  const mem = raw.memory || {};
  const storage = raw.storage_devices || {};
  const m2 = Array.isArray(raw.m2_slots) ? raw.m2_slots.length : 0;
  return {
    ...b,
    summary: [
      str(raw.socket),
      str(raw.chipset),
      str(raw.form_factor),
      mem.ram_type,
      mem.slots != null ? `${mem.slots} slots` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      socket: str(raw.socket),
      formFactor: str(raw.form_factor),
      chipset: str(raw.chipset),
      ramType: str(mem.ram_type),
      ramSlots: num(mem.slots),
      ramMaxGb: num(mem.max),
      sataPorts: num(storage.sata_6_gb_s, 0) + num(storage.sata_3_gb_s, 0),
      m2Slots: m2,
      pcieSlots: Array.isArray(raw.pcie_slots) ? raw.pcie_slots : [],
    },
  };
}

function normalizeMemory(raw) {
  const b = base(raw, "memory");
  const modules = raw.modules || {};
  const capacity = num(raw.capacity) ?? num(modules.capacity_gb) * num(modules.quantity, 1);
  const speed = num(raw.speed);
  const ramType = str(raw.ram_type);
  const qty = num(modules.quantity, 1);
  return {
    ...b,
    tdpW: 10,
    summary: [
      capacity != null ? `${capacity}GB` : null,
      ramType && speed ? `${ramType}-${speed}` : ramType || null,
      qty != null ? `${qty} modules` : null,
      raw.cas_latency != null ? `CL${raw.cas_latency}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      capacityGb: capacity,
      speedMtps: speed,
      ramType,
      modules: qty,
      moduleCapacityGb: num(modules.capacity_gb),
      formFactor: str(raw.form_factor),
      ecc: str(raw.ecc),
    },
  };
}

function normalizeStorage(raw) {
  const b = base(raw, "storage");
  const capacity = num(raw.capacity);
  const form = str(raw.form_factor);
  const iface = str(raw.interface);
  const type = str(raw.type || raw.storage_type);
  return {
    ...b,
    tdpW: type.toLowerCase().includes("hdd") ? 8 : 5,
    summary: [
      capacity != null ? `${capacity}GB` : null,
      type,
      form,
      iface,
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      capacityGb: capacity,
      type,
      formFactor: form,
      interface: iface,
      nvme: Boolean(raw.nvme),
    },
  };
}

function normalizeCase(raw) {
  const b = base(raw, "case");
  return {
    ...b,
    summary: [
      str(raw.form_factor),
      raw.max_video_card_length != null
        ? `GPU≤${raw.max_video_card_length}mm`
        : null,
      raw.max_cpu_cooler_height != null
        ? `Cooler≤${raw.max_cpu_cooler_height}mm`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      formFactor: str(raw.form_factor),
      motherboardFormFactors: Array.isArray(raw.supported_motherboard_form_factors)
        ? raw.supported_motherboard_form_factors.map(String)
        : [],
      maxGpuLengthMm: num(raw.max_video_card_length),
      maxCoolerHeightMm: num(raw.max_cpu_cooler_height),
      maxPsuLengthMm: num(raw.max_power_supply_length ?? raw.power_supply_shroud),
    },
  };
}

function normalizePsu(raw) {
  const b = base(raw, "psu");
  const wattage = num(raw.wattage);
  const connectors = raw.connectors || {};
  return {
    ...b,
    wattage,
    summary: [
      wattage != null ? `${wattage}W` : null,
      str(raw.efficiency_rating),
      str(raw.modular),
      str(raw.form_factor),
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      wattage,
      formFactor: str(raw.form_factor),
      efficiency: str(raw.efficiency_rating),
      modular: str(raw.modular),
      lengthMm: num(raw.length),
      connectors: {
        atx24: num(connectors.atx_24_pin, 0),
        eps8: num(connectors.eps_8_pin, 0),
        pcie62: num(connectors.pcie_6_plus_2_pin, 0),
        pcie12VHPWR: num(connectors.pcie_12vhpwr, 0),
        sata: num(connectors.sata, 0),
      },
    },
  };
}

function normalizeCooler(raw) {
  const b = base(raw, "cpu-cooler");
  const height = num(raw.height);
  const water = Boolean(raw.water_cooled);
  return {
    ...b,
    tdpW: 5,
    summary: [
      water ? `AIO ${raw.radiator_size || ""}mm`.trim() : "Air",
      height != null ? `${height}mm` : null,
      Array.isArray(raw.cpu_sockets)
        ? `${raw.cpu_sockets.length} sockets`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      heightMm: height,
      waterCooled: water,
      radiatorSizeMm: num(raw.radiator_size),
      sockets: Array.isArray(raw.cpu_sockets) ? raw.cpu_sockets.map(String) : [],
      fanless: Boolean(raw.fanless),
    },
  };
}

function normalizeMonitor(raw) {
  const b = base(raw, "monitor");
  const res = raw.resolution || {};
  const w = num(res.horizontalRes);
  const h = num(res.verticalRes);
  return {
    ...b,
    summary: [
      raw.screen_size != null ? `${raw.screen_size}"` : null,
      w && h ? `${w}x${h}` : null,
      raw.refresh_rate != null ? `${raw.refresh_rate}Hz` : null,
      str(raw.panel_type),
    ]
      .filter(Boolean)
      .join(" · "),
    specs: {
      screenSizeIn: num(raw.screen_size),
      width: w,
      height: h,
      refreshHz: num(raw.refresh_rate),
      panel: str(raw.panel_type),
    },
  };
}

function normalizeGeneric(raw, category, extraSummary = []) {
  const b = base(raw, category);
  return {
    ...b,
    summary: [b.manufacturer, ...extraSummary].filter(Boolean).join(" · ") || b.name,
    specs: {},
  };
}

function normalizeOne(category, raw) {
  switch (category) {
    case "cpu":
      return normalizeCpu(raw);
    case "gpu":
      return normalizeGpu(raw);
    case "motherboard":
      return normalizeMotherboard(raw);
    case "memory":
      return normalizeMemory(raw);
    case "storage":
      return normalizeStorage(raw);
    case "case":
      return normalizeCase(raw);
    case "psu":
      return normalizePsu(raw);
    case "cpu-cooler":
      return normalizeCooler(raw);
    case "monitor":
      return normalizeMonitor(raw);
    case "case-fan":
      return {
        ...base(raw, category),
        summary: [
          raw.size != null ? `${raw.size}mm` : null,
          raw.pwm ? "PWM" : null,
          raw.quantity != null ? `x${raw.quantity}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        specs: {
          sizeMm: num(raw.size),
          quantity: num(raw.quantity, 1),
          pwm: Boolean(raw.pwm),
        },
        tdpW: 3,
      };
    case "os":
      return normalizeGeneric(raw, category, [str(raw.mode || raw.version)]);
    default:
      return normalizeGeneric(raw, category);
  }
}

function loadCategory(openDbDir, category) {
  const dir = join(CACHE, "open-db", openDbDir);
  if (!existsSync(dir)) {
    console.warn(`skip missing ${openDbDir}`);
    return [];
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const parts = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const part = normalizeOne(category, raw);
      if (!part.id || !part.name) continue;
      parts.push(part);
    } catch (err) {
      console.warn(`failed ${openDbDir}/${file}: ${err.message}`);
    }
  }
  parts.sort((a, b) => a.name.localeCompare(b.name));
  return parts;
}

function main() {
  const revision = ensureRepo();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const manifestCategories = [];
  let total = 0;

  for (const [id, openDb] of CATEGORIES) {
    process.stdout.write(`Normalizing ${id} (${openDb})… `);
    const parts = loadCategory(openDb, id);
    const file = `${id}.json`;
    writeFileSync(join(OUT, file), JSON.stringify(parts));
    console.log(`${parts.length} parts`);
    manifestCategories.push({ id, openDb, count: parts.length, file });
    total += parts.length;
  }

  const manifest = {
    version: "2026.07-opendb",
    source: "https://github.com/buildcores/buildcores-open-db",
    sourceRevision: revision,
    license: "ODC-By-1.0",
    attribution:
      "Component catalog derived from BuildCores OpenDB (https://github.com/buildcores/buildcores-open-db), licensed under the Open Data Commons Attribution License (ODC-By) v1.0.",
    updated: new Date().toISOString().slice(0, 10),
    categories: manifestCategories,
    totalParts: total,
  };

  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(
    join(ROOT, "src/data/catalog-revision.json"),
    JSON.stringify(
      { revision, updated: manifest.updated, totalParts: total },
      null,
      2,
    ),
  );

  // Keep a tiny ATTRIBUTION note beside the shards.
  writeFileSync(
    join(OUT, "ATTRIBUTION.txt"),
    `${manifest.attribution}\nSource revision: ${revision}\n`,
  );

  console.log(`\nWrote ${total} parts across ${manifestCategories.length} categories to public/catalog/`);
}

main();
