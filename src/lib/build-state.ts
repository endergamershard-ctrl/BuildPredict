import { CATEGORIES, type CategoryId } from "@/lib/categories";
import type {
  BuildSelection,
  CatalogPart,
  PartSlots,
  QualityPreset,
  Resolution,
} from "@/lib/types";

export type BrowserSlot = CategoryId;

export const DEFAULT_SELECTION: BuildSelection = {
  parts: {},
  customParts: {},
  priceOverrides: {},
  gameId: "cyberpunk",
  workloadId: "backend-compile",
  resolution: "1440p",
  quality: "high",
  showExtras: false,
};

const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4k"];
const QUALITIES: QualityPreset[] = ["medium", "high", "ultra"];
const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

export { slotLabel } from "@/lib/categories";

function decodeParts(raw: string | null): PartSlots {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as PartSlots;
    const out: PartSlots = {};
    for (const [key, ids] of Object.entries(parsed)) {
      if (!CATEGORY_IDS.has(key as CategoryId)) continue;
      if (!Array.isArray(ids)) continue;
      out[key as CategoryId] = ids.filter((id) => typeof id === "string");
    }
    return out;
  } catch {
    return {};
  }
}

function decodeCustom(raw: string | null): Record<string, CatalogPart> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, CatalogPart>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function decodePrices(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Migrate legacy ?cpu=&gpu=&ram= links into the v2 parts map. */
function migrateLegacy(params: URLSearchParams, parts: PartSlots): PartSlots {
  const next = { ...parts };
  const cpu = params.get("cpu");
  const gpu = params.get("gpu");
  const ram = params.get("ram");
  if (cpu && !next.cpu?.length) next.cpu = [cpu];
  if (gpu && !next.gpu?.length) next.gpu = [gpu];
  if (ram && !next.memory?.length) next.memory = [ram];
  return next;
}

export function selectionFromSearchParams(
  params: URLSearchParams,
): BuildSelection {
  const resolution = params.get("res");
  const quality = params.get("quality");
  let parts = decodeParts(params.get("parts"));
  parts = migrateLegacy(params, parts);

  return {
    parts,
    customParts: decodeCustom(params.get("custom")),
    priceOverrides: decodePrices(params.get("prices")),
    gameId: params.get("game") ?? DEFAULT_SELECTION.gameId,
    workloadId: params.get("work") ?? DEFAULT_SELECTION.workloadId,
    resolution: RESOLUTIONS.includes(resolution as Resolution)
      ? (resolution as Resolution)
      : DEFAULT_SELECTION.resolution,
    quality: QUALITIES.includes(quality as QualityPreset)
      ? (quality as QualityPreset)
      : DEFAULT_SELECTION.quality,
    showExtras: params.get("extras") === "1",
  };
}

export function selectionToSearchParams(selection: BuildSelection): string {
  const params = new URLSearchParams();
  params.set("v", "2");
  if (Object.keys(selection.parts).length) {
    params.set("parts", JSON.stringify(selection.parts));
  }
  if (Object.keys(selection.customParts).length) {
    params.set("custom", JSON.stringify(selection.customParts));
  }
  if (Object.keys(selection.priceOverrides).length) {
    params.set("prices", JSON.stringify(selection.priceOverrides));
  }
  params.set("game", selection.gameId);
  params.set("work", selection.workloadId);
  params.set("res", selection.resolution);
  params.set("quality", selection.quality);
  if (selection.showExtras) params.set("extras", "1");
  return params.toString();
}

export function getSlotIds(
  selection: BuildSelection,
  slot: CategoryId,
): string[] {
  return selection.parts[slot] ?? [];
}

export function setSlotIds(
  selection: BuildSelection,
  slot: CategoryId,
  ids: string[],
): BuildSelection {
  const parts = { ...selection.parts };
  if (ids.length === 0) delete parts[slot];
  else parts[slot] = ids;
  return { ...selection, parts };
}

export function addPartToSlot(
  selection: BuildSelection,
  slot: CategoryId,
  id: string,
  multiple: boolean,
): BuildSelection {
  const current = getSlotIds(selection, slot);
  if (multiple) {
    if (current.includes(id)) return selection;
    return setSlotIds(selection, slot, [...current, id]);
  }
  return setSlotIds(selection, slot, [id]);
}

export function removePartFromSlot(
  selection: BuildSelection,
  slot: CategoryId,
  id?: string,
): BuildSelection {
  if (!id) return setSlotIds(selection, slot, []);
  return setSlotIds(
    selection,
    slot,
    getSlotIds(selection, slot).filter((x) => x !== id),
  );
}

export function makeCustomPart(
  slot: CategoryId,
  name: string,
  summary = "Custom part",
): CatalogPart {
  const id = `custom-${slot}-${Date.now().toString(36)}`;
  return {
    id,
    category: slot,
    name: name.trim() || "Custom part",
    manufacturer: "Custom",
    partNumbers: [],
    summary,
    specs: {},
    skus: {},
    custom: true,
  };
}
