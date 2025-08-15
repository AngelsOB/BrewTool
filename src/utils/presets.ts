import { loadJson, saveJson } from "./storage";

export type GrainPreset = {
  name: string;
  colorLovibond: number;
};

export type HopPreset = {
  name: string;
  alphaAcidPercent: number;
};

export const GRAIN_PRESETS: GrainPreset[] = [
  { name: "Pilsner Malt", colorLovibond: 1.5 },
  { name: "Pale Malt (2-Row)", colorLovibond: 2 },
  { name: "Maris Otter", colorLovibond: 3 },
  { name: "Vienna Malt", colorLovibond: 4 },
  { name: "Munich Malt", colorLovibond: 10 },
  { name: "Wheat Malt", colorLovibond: 2 },
  { name: "Crystal 20L", colorLovibond: 20 },
  { name: "Crystal 40L", colorLovibond: 40 },
  { name: "Crystal 60L", colorLovibond: 60 },
  { name: "Chocolate Malt", colorLovibond: 350 },
  { name: "Roasted Barley", colorLovibond: 500 },
];

export const HOP_PRESETS: HopPreset[] = [
  { name: "Cascade", alphaAcidPercent: 5.5 },
  { name: "Centennial", alphaAcidPercent: 10 },
  { name: "Citra", alphaAcidPercent: 12.5 },
  { name: "Mosaic", alphaAcidPercent: 12 },
  { name: "Simcoe", alphaAcidPercent: 13 },
  { name: "Amarillo", alphaAcidPercent: 9 },
  { name: "Saaz", alphaAcidPercent: 3.5 },
  { name: "Hallertau Mittelfrüh", alphaAcidPercent: 4 },
  { name: "East Kent Goldings", alphaAcidPercent: 5 },
  { name: "Fuggle", alphaAcidPercent: 4.5 },
];

const CUSTOM_GRAINS_KEY = "beerapp.customGrains";
const CUSTOM_HOPS_KEY = "beerapp.customHops";

export function getGrainPresets(): GrainPreset[] {
  const custom = loadJson<GrainPreset[]>(CUSTOM_GRAINS_KEY, []);
  return [...GRAIN_PRESETS, ...custom];
}

export function getHopPresets(): HopPreset[] {
  const custom = loadJson<HopPreset[]>(CUSTOM_HOPS_KEY, []);
  return [...HOP_PRESETS, ...custom];
}

export function addCustomGrain(p: GrainPreset): GrainPreset[] {
  const list = loadJson<GrainPreset[]>(CUSTOM_GRAINS_KEY, []);
  const next = [...list.filter((x) => x.name !== p.name), p];
  saveJson(CUSTOM_GRAINS_KEY, next);
  return [...GRAIN_PRESETS, ...next];
}

export function addCustomHop(p: HopPreset): HopPreset[] {
  const list = loadJson<HopPreset[]>(CUSTOM_HOPS_KEY, []);
  const next = [...list.filter((x) => x.name !== p.name), p];
  saveJson(CUSTOM_HOPS_KEY, next);
  return [...HOP_PRESETS, ...next];
}
