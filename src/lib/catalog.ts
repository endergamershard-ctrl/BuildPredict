import type { CategoryId } from "@/lib/categories";
import type { CatalogManifest, CatalogPart } from "@/lib/types";

const categoryCache = new Map<CategoryId, CatalogPart[]>();
const indexCache = new Map<CategoryId, Map<string, CatalogPart>>();
let manifestPromise: Promise<CatalogManifest> | null = null;

function catalogUrl(file: string): string {
  // Works for Next static export and Tauri asset protocol.
  if (typeof window !== "undefined") {
    return new URL(`catalog/${file}`, window.location.href).toString();
  }
  return `/catalog/${file}`;
}

export async function loadManifest(): Promise<CatalogManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(catalogUrl("manifest.json")).then(async (res) => {
      if (!res.ok) throw new Error(`Failed to load catalog manifest (${res.status})`);
      return res.json() as Promise<CatalogManifest>;
    });
  }
  return manifestPromise;
}

export async function loadCategory(category: CategoryId): Promise<CatalogPart[]> {
  const hit = categoryCache.get(category);
  if (hit) return hit;

  const res = await fetch(catalogUrl(`${category}.json`));
  if (!res.ok) {
    categoryCache.set(category, []);
    return [];
  }
  const parts = (await res.json()) as CatalogPart[];
  categoryCache.set(category, parts);
  indexCache.set(category, new Map(parts.map((p) => [p.id, p])));
  return parts;
}

export async function getPart(
  category: CategoryId,
  id: string,
): Promise<CatalogPart | undefined> {
  await loadCategory(category);
  return indexCache.get(category)?.get(id);
}

export function getPartSync(
  category: CategoryId,
  id: string,
): CatalogPart | undefined {
  return indexCache.get(category)?.get(id);
}

export async function resolveParts(
  customParts: Record<string, CatalogPart>,
  category: CategoryId,
  ids: string[] | undefined,
): Promise<CatalogPart[]> {
  if (!ids?.length) return [];
  await loadCategory(category);
  return ids
    .map((id) => customParts[id] ?? indexCache.get(category)?.get(id))
    .filter((p): p is CatalogPart => Boolean(p));
}

export interface BrowseFilters {
  query?: string;
  manufacturer?: string;
  /** Extra predicate */
  predicate?: (part: CatalogPart) => boolean;
}

export async function browseCategory(
  category: CategoryId,
  filters: BrowseFilters = {},
  page = 0,
  pageSize = 50,
): Promise<{ parts: CatalogPart[]; total: number; manufacturers: string[] }> {
  const all = await loadCategory(category);
  const manufacturers = Array.from(
    new Set(all.map((p) => p.manufacturer).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const q = filters.query?.trim().toLowerCase() ?? "";
  const filtered = all.filter((part) => {
    if (filters.manufacturer && filters.manufacturer !== "all") {
      if (part.manufacturer !== filters.manufacturer) return false;
    }
    if (q) {
      const hay = `${part.name} ${part.manufacturer} ${part.summary} ${part.partNumbers.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.predicate && !filters.predicate(part)) return false;
    return true;
  });

  const start = page * pageSize;
  return {
    parts: filtered.slice(start, start + pageSize),
    total: filtered.length,
    manufacturers,
  };
}

export function clearCatalogCache(): void {
  categoryCache.clear();
  indexCache.clear();
  manifestPromise = null;
}
