import type { CatalogPart, PriceQuote } from "@/lib/types";

export interface PricingSettings {
  bestBuyKey: string;
  retailerApiKey: string;
  enabledProviders: Array<"bestbuy" | "retailerapi">;
}

const STORAGE_KEY = "buildpredict.pricing.v1";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const mod = await import("@tauri-apps/api/core");
  return mod.invoke<T>(cmd, args);
}

export async function getPricingSettings(): Promise<PricingSettings> {
  if (isTauriRuntime()) {
    try {
      return await invoke<PricingSettings>("get_pricing_settings");
    } catch {
      // fall through
    }
  }
  if (typeof window === "undefined") {
    return { bestBuyKey: "", retailerApiKey: "", enabledProviders: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { bestBuyKey: "", retailerApiKey: "", enabledProviders: [] };
    }
    return JSON.parse(raw) as PricingSettings;
  } catch {
    return { bestBuyKey: "", retailerApiKey: "", enabledProviders: [] };
  }
}

export async function savePricingSettings(
  settings: PricingSettings,
): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("save_pricing_settings", { settings });
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function fetchLiveQuotes(
  parts: CatalogPart[],
): Promise<PriceQuote[]> {
  if (!parts.length) return [];
  if (!isTauriRuntime()) return [];
  return invoke<PriceQuote[]>("fetch_price_quotes", {
    parts: parts.map((p) => ({
      id: p.id,
      name: p.name,
      manufacturer: p.manufacturer,
      skus: p.skus,
    })),
  });
}
