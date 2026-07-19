export type CategoryId =
  | "cpu"
  | "cpu-cooler"
  | "motherboard"
  | "memory"
  | "storage"
  | "gpu"
  | "case"
  | "psu"
  | "os"
  | "case-fan"
  | "thermal-compound"
  | "monitor"
  | "capture-card"
  | "network-card"
  | "sound-card"
  | "keyboard"
  | "mouse"
  | "headphones"
  | "speakers"
  | "microphone"
  | "webcam"
  | "lighting"
  | "accessory";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  /** OpenDB directory name */
  openDb: string;
  /** Allow multiple selected parts */
  multiple: boolean;
  /** Included in core System Builder rows by default */
  core: boolean;
  /** Affects FPS / coding estimates when present */
  performanceRelevant: boolean;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "cpu", label: "CPU", openDb: "CPU", multiple: false, core: true, performanceRelevant: true },
  { id: "cpu-cooler", label: "CPU Cooler", openDb: "CPUCooler", multiple: false, core: true, performanceRelevant: false },
  { id: "motherboard", label: "Motherboard", openDb: "Motherboard", multiple: false, core: true, performanceRelevant: false },
  { id: "memory", label: "Memory", openDb: "RAM", multiple: true, core: true, performanceRelevant: true },
  { id: "storage", label: "Storage", openDb: "Storage", multiple: true, core: true, performanceRelevant: false },
  { id: "gpu", label: "Video Card", openDb: "GPU", multiple: false, core: true, performanceRelevant: true },
  { id: "case", label: "Case", openDb: "PCCase", multiple: false, core: true, performanceRelevant: false },
  { id: "psu", label: "Power Supply", openDb: "PSU", multiple: false, core: true, performanceRelevant: false },
  { id: "os", label: "Operating System", openDb: "OS", multiple: false, core: true, performanceRelevant: false },
  { id: "case-fan", label: "Case Fan", openDb: "CaseFan", multiple: true, core: false, performanceRelevant: false },
  { id: "thermal-compound", label: "Thermal Compound", openDb: "ThermalCompound", multiple: false, core: false, performanceRelevant: false },
  { id: "monitor", label: "Monitor", openDb: "Monitor", multiple: true, core: false, performanceRelevant: false },
  { id: "capture-card", label: "Capture Card", openDb: "CaptureCard", multiple: true, core: false, performanceRelevant: false },
  { id: "network-card", label: "Network Card", openDb: "NetworkCard", multiple: true, core: false, performanceRelevant: false },
  { id: "sound-card", label: "Sound Card", openDb: "SoundCard", multiple: true, core: false, performanceRelevant: false },
  { id: "keyboard", label: "Keyboard", openDb: "Keyboard", multiple: false, core: false, performanceRelevant: false },
  { id: "mouse", label: "Mouse", openDb: "Mouse", multiple: false, core: false, performanceRelevant: false },
  { id: "headphones", label: "Headphones", openDb: "Headphones", multiple: false, core: false, performanceRelevant: false },
  { id: "speakers", label: "Speakers", openDb: "Speaker", multiple: false, core: false, performanceRelevant: false },
  { id: "microphone", label: "Microphone", openDb: "Microphone", multiple: false, core: false, performanceRelevant: false },
  { id: "webcam", label: "Webcam", openDb: "Webcam", multiple: false, core: false, performanceRelevant: false },
  { id: "lighting", label: "Lighting", openDb: "Lighting", multiple: true, core: false, performanceRelevant: false },
  { id: "accessory", label: "Accessory", openDb: "Accessory", multiple: true, core: false, performanceRelevant: false },
];

export const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

export const OPENDB_TO_CATEGORY: Record<string, CategoryId> = Object.fromEntries(
  CATEGORIES.map((c) => [c.openDb, c.id]),
);

export function slotLabel(id: CategoryId): string {
  return CATEGORY_BY_ID[id].label;
}
