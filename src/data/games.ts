import type { GameTitle, QualityPreset, Resolution } from "@/lib/types";

export const GAMES: GameTitle[] = [
  {
    id: "cs2",
    name: "Counter-Strike 2",
    gpuDemand: 55,
    cpuDemand: 130,
    year: 2023,
  },
  {
    id: "valorant",
    name: "Valorant",
    gpuDemand: 40,
    cpuDemand: 110,
    year: 2020,
  },
  {
    id: "fortnite",
    name: "Fortnite",
    gpuDemand: 85,
    cpuDemand: 105,
    year: 2017,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk 2077",
    gpuDemand: 145,
    cpuDemand: 100,
    year: 2020,
  },
  {
    id: "rdr2",
    name: "Red Dead Redemption 2",
    gpuDemand: 125,
    cpuDemand: 95,
    year: 2019,
  },
  {
    id: "warzone",
    name: "Call of Duty: Warzone",
    gpuDemand: 120,
    cpuDemand: 115,
    year: 2022,
  },
  {
    id: "hogwarts",
    name: "Hogwarts Legacy",
    gpuDemand: 135,
    cpuDemand: 100,
    year: 2023,
  },
  {
    id: "minecraft",
    name: "Minecraft (Java)",
    gpuDemand: 45,
    cpuDemand: 140,
    year: 2011,
  },
];

export const RESOLUTION_SCALE: Record<Resolution, number> = {
  "1080p": 1.0,
  "1440p": 0.68,
  "4k": 0.38,
};

export const QUALITY_SCALE: Record<QualityPreset, number> = {
  medium: 1.2,
  high: 1.0,
  ultra: 0.82,
};

export function getGame(id: string): GameTitle | undefined {
  return GAMES.find((game) => game.id === id);
}
