import type {
  BuildSelection,
  CatalogPart,
  CompatIssue,
  CompatibilityReport,
} from "@/lib/types";

const PLATFORM_WATTS = 75;

function specStr(part: CatalogPart | undefined, key: string): string | undefined {
  const v = part?.specs?.[key];
  return typeof v === "string" && v ? v : undefined;
}

function specNum(part: CatalogPart | undefined, key: string): number | undefined {
  const v = part?.specs?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function normalizeSocket(s: string): string {
  return s.toLowerCase().replace(/[\s_-]+/g, "").replace(/^lga/, "lga ");
}

function socketsCompatible(a: string, b: string): boolean {
  const na = normalizeSocket(a);
  const nb = normalizeSocket(b);
  return na === nb || na.replace(/\s/g, "") === nb.replace(/\s/g, "");
}

function formFactorFits(board: string, supported: string[]): boolean | "unknown" {
  if (!board || supported.length === 0) return "unknown";
  const b = board.toLowerCase();
  const ok = supported.some((s) => {
    const t = s.toLowerCase();
    return t === b || t.includes(b) || b.includes(t.replace(" mid tower", "").trim());
  });
  return ok;
}

export function estimateSystemWatts(parts: {
  cpu?: CatalogPart;
  gpu?: CatalogPart;
  memory: CatalogPart[];
  storage: CatalogPart[];
  cooler?: CatalogPart;
}): number {
  const cpuW = parts.cpu?.tdpW ?? 65;
  const gpuW = parts.gpu?.tdpW ?? 0;
  const memW = parts.memory.reduce((s, p) => s + (p.tdpW ?? 10), 0);
  const storageW = parts.storage.reduce((s, p) => s + (p.tdpW ?? 5), 0);
  const coolerW = parts.cooler?.tdpW ?? 5;
  return Math.round(
    PLATFORM_WATTS + cpuW * 0.7 + gpuW * 0.9 + memW + storageW + coolerW,
  );
}

export function evaluateCompatibility(input: {
  selection: BuildSelection;
  cpu?: CatalogPart;
  cooler?: CatalogPart;
  motherboard?: CatalogPart;
  memory: CatalogPart[];
  storage: CatalogPart[];
  gpu?: CatalogPart;
  pcCase?: CatalogPart;
  psu?: CatalogPart;
}): CompatibilityReport {
  const issues: CompatIssue[] = [];
  const {
    cpu,
    cooler,
    motherboard,
    memory,
    storage,
    gpu,
    pcCase,
    psu,
  } = input;

  if (cpu && motherboard) {
    const cpuSocket = specStr(cpu, "socket");
    const mbSocket = specStr(motherboard, "socket");
    if (!cpuSocket || !mbSocket) {
      issues.push({
        severity: "unknown",
        code: "socket-unknown",
        message: "CPU/motherboard socket data is incomplete; compatibility unverified.",
        categories: ["cpu", "motherboard"],
      });
    } else if (!socketsCompatible(cpuSocket, mbSocket)) {
      issues.push({
        severity: "error",
        code: "socket-mismatch",
        message: `CPU socket ${cpuSocket} does not match motherboard socket ${mbSocket}.`,
        categories: ["cpu", "motherboard"],
      });
    }
  }

  if (cooler && cpu) {
    const sockets = cooler.specs.sockets;
    const cpuSocket = specStr(cpu, "socket");
    if (!cpuSocket || !Array.isArray(sockets) || sockets.length === 0) {
      issues.push({
        severity: "unknown",
        code: "cooler-socket-unknown",
        message: "CPU cooler socket support is incomplete.",
        categories: ["cpu", "cpu-cooler"],
      });
    } else if (!sockets.some((s) => typeof s === "string" && socketsCompatible(s, cpuSocket))) {
      issues.push({
        severity: "error",
        code: "cooler-socket-mismatch",
        message: `Cooler does not list support for CPU socket ${cpuSocket}.`,
        categories: ["cpu", "cpu-cooler"],
      });
    }
  }

  if (motherboard && memory.length) {
    const ramType = specStr(motherboard, "ramType");
    const slots = specNum(motherboard, "ramSlots");
    const maxGb = specNum(motherboard, "ramMaxGb");
    let moduleCount = 0;
    let totalGb = 0;
    for (const kit of memory) {
      const kitType = specStr(kit, "ramType");
      if (ramType && kitType && kitType.toUpperCase() !== ramType.toUpperCase()) {
        issues.push({
          severity: "error",
          code: "ram-type-mismatch",
          message: `Memory ${kit.name} is ${kitType} but motherboard expects ${ramType}.`,
          categories: ["memory", "motherboard"],
        });
      } else if (!ramType || !kitType) {
        issues.push({
          severity: "unknown",
          code: "ram-type-unknown",
          message: `RAM type incomplete for ${kit.name}.`,
          categories: ["memory", "motherboard"],
        });
      }
      moduleCount += specNum(kit, "modules") ?? 1;
      totalGb += specNum(kit, "capacityGb") ?? 0;
    }
    if (slots != null && moduleCount > slots) {
      issues.push({
        severity: "error",
        code: "ram-slots",
        message: `Selected memory uses ${moduleCount} modules but motherboard has ${slots} slots.`,
        categories: ["memory", "motherboard"],
      });
    }
    if (maxGb != null && totalGb > maxGb) {
      issues.push({
        severity: "error",
        code: "ram-max",
        message: `Total ${totalGb}GB RAM exceeds motherboard max ${maxGb}GB.`,
        categories: ["memory", "motherboard"],
      });
    }
  }

  if (motherboard && pcCase) {
    const boardFf = specStr(motherboard, "formFactor");
    const supported = Array.isArray(pcCase.specs.motherboardFormFactors)
      ? (pcCase.specs.motherboardFormFactors as string[])
      : [];
    const fit = formFactorFits(boardFf ?? "", supported);
    if (fit === false) {
      issues.push({
        severity: "error",
        code: "case-mobo-ff",
        message: `Case does not list support for motherboard form factor ${boardFf}.`,
        categories: ["case", "motherboard"],
      });
    } else if (fit === "unknown") {
      issues.push({
        severity: "unknown",
        code: "case-mobo-unknown",
        message: "Case/motherboard form-factor data incomplete.",
        categories: ["case", "motherboard"],
      });
    }
  }

  if (gpu && pcCase) {
    const gpuLen = specNum(gpu, "lengthMm");
    const maxLen = specNum(pcCase, "maxGpuLengthMm");
    if (gpuLen != null && maxLen != null && gpuLen > maxLen) {
      issues.push({
        severity: "error",
        code: "gpu-length",
        message: `GPU length ${gpuLen}mm exceeds case clearance ${maxLen}mm.`,
        categories: ["gpu", "case"],
      });
    } else if (gpuLen == null || maxLen == null) {
      issues.push({
        severity: "unknown",
        code: "gpu-length-unknown",
        message: "GPU or case length clearance data incomplete.",
        categories: ["gpu", "case"],
      });
    }
  }

  if (cooler && pcCase && !cooler.specs.waterCooled) {
    const height = specNum(cooler, "heightMm");
    const maxH = specNum(pcCase, "maxCoolerHeightMm");
    if (height != null && maxH != null && height > maxH) {
      issues.push({
        severity: "error",
        code: "cooler-height",
        message: `Cooler height ${height}mm exceeds case clearance ${maxH}mm.`,
        categories: ["cpu-cooler", "case"],
      });
    }
  }

  if (motherboard && storage.length) {
    const sata = specNum(motherboard, "sataPorts") ?? 0;
    const m2 = specNum(motherboard, "m2Slots") ?? 0;
    let sataUsed = 0;
    let m2Used = 0;
    for (const drive of storage) {
      const ff = (specStr(drive, "formFactor") || "").toLowerCase();
      const iface = (specStr(drive, "interface") || "").toLowerCase();
      if (ff.includes("m.2") || iface.includes("m.2") || drive.specs.nvme) {
        m2Used += 1;
      } else {
        sataUsed += 1;
      }
    }
    if (m2Used > m2) {
      issues.push({
        severity: "error",
        code: "m2-slots",
        message: `Need ${m2Used} M.2 slots but motherboard has ${m2}.`,
        categories: ["storage", "motherboard"],
      });
    }
    if (sataUsed > sata) {
      issues.push({
        severity: "error",
        code: "sata-ports",
        message: `Need ${sataUsed} SATA ports but motherboard has ${sata}.`,
        categories: ["storage", "motherboard"],
      });
    }
  }

  const estimatedWatts = estimateSystemWatts({
    cpu,
    gpu,
    memory,
    storage,
    cooler,
  });

  if (psu) {
    const rating = psu.wattage ?? specNum(psu, "wattage");
    if (rating == null) {
      issues.push({
        severity: "unknown",
        code: "psu-unknown",
        message: "PSU wattage unknown; cannot verify power headroom.",
        categories: ["psu"],
      });
    } else if (rating < estimatedWatts) {
      issues.push({
        severity: "error",
        code: "psu-underpowered",
        message: `Estimated draw ~${estimatedWatts}W exceeds PSU rating ${rating}W.`,
        categories: ["psu"],
      });
    } else if (rating < estimatedWatts * 1.2) {
      issues.push({
        severity: "warning",
        code: "psu-headroom",
        message: `PSU ${rating}W has less than 20% headroom over ~${estimatedWatts}W estimated draw.`,
        categories: ["psu"],
      });
    }

    if (gpu) {
      const need8 = gpu.specs.powerConnectors as
        | { pcie8?: number; pcie12VHPWR?: number; pcie12V2x6?: number }
        | undefined;
      const have = psu.specs.connectors as
        | { pcie62?: number; pcie12VHPWR?: number }
        | undefined;
      if (need8 && have) {
        const wants12 = (need8.pcie12VHPWR ?? 0) + (need8.pcie12V2x6 ?? 0);
        if (wants12 > 0 && (have.pcie12VHPWR ?? 0) < wants12) {
          issues.push({
            severity: "warning",
            code: "psu-12vhpwr",
            message: "GPU may need 12VHPWR/12V-2x6 connectors that the PSU does not list.",
            categories: ["gpu", "psu"],
          });
        }
        if ((need8.pcie8 ?? 0) > (have.pcie62 ?? 0) && wants12 === 0) {
          issues.push({
            severity: "warning",
            code: "psu-pcie",
            message: `GPU wants ${need8.pcie8}× 8-pin PCIe; PSU lists ${have.pcie62 ?? 0}.`,
            categories: ["gpu", "psu"],
          });
        }
      }
    }
  }

  for (const part of [cpu, cooler, motherboard, gpu, pcCase, psu, ...memory, ...storage]) {
    if (part?.custom) {
      issues.push({
        severity: "info",
        code: "custom-part",
        message: `Custom part "${part.name}" has limited compatibility checking.`,
        categories: [part.category],
      });
    }
  }

  return {
    issues,
    estimatedWatts,
    hardErrors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
  };
}
