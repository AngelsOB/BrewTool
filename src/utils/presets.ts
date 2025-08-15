import { loadJson, saveJson } from "./storage";

export type GrainPreset = {
  name: string;
  colorLovibond: number;
  yield: number; // as a decimal, e.g., 0.75 for 75%
};

export type HopPreset = {
  name: string;
  alphaAcidPercent: number;
  category?: string; // Optional category, e.g., "US Hops", "Noble Hops", "New Zealand Hops"
};

export type YeastPreset = {
  name: string;
  attenuationPercent?: number;
  category: string; // e.g., "Escarpment Labs", "Wyeast", "Fermentis"
};

export const GRAIN_PRESETS: GrainPreset[] = [
  { name: "Pilsner Malt", colorLovibond: 1.5, yield: 0.8 },
  { name: "Pale Malt (2-Row)", colorLovibond: 2, yield: 0.78 },
  { name: "Maris Otter", colorLovibond: 3, yield: 0.81 },
  { name: "Vienna Malt", colorLovibond: 4, yield: 0.78 },
  { name: "Munich Malt", colorLovibond: 10, yield: 0.75 },
  { name: "Wheat Malt", colorLovibond: 2, yield: 0.8 },
  { name: "Crystal 20L", colorLovibond: 20, yield: 0.75 },
  { name: "Crystal 40L", colorLovibond: 40, yield: 0.72 },
  { name: "Crystal 60L", colorLovibond: 60, yield: 0.7 },
  { name: "Chocolate Malt", colorLovibond: 350, yield: 0.6 },
  { name: "Roasted Barley", colorLovibond: 500, yield: 0.55 },
  { name: "Acid Malt", colorLovibond: 3, yield: 0.75 },
  { name: "Amber Malt", colorLovibond: 25, yield: 0.7 },
  { name: "Biscuit Malt", colorLovibond: 25, yield: 0.75 },
  { name: "Black (Patent) Malt", colorLovibond: 500, yield: 0.55 },
  { name: "Brown Malt", colorLovibond: 65, yield: 0.65 },
  { name: "Cara-Pils/Dextrine", colorLovibond: 2, yield: 0.78 },
  { name: "Caramunich Malt", colorLovibond: 56, yield: 0.75 },
  { name: "Caravienne Malt", colorLovibond: 22, yield: 0.75 },
  { name: "Chocolate Malt (Darker)", colorLovibond: 400, yield: 0.6 },
  { name: "Crystal 10L", colorLovibond: 10, yield: 0.75 },
  { name: "Crystal 80L", colorLovibond: 80, yield: 0.68 },
  { name: "Crystal 120L", colorLovibond: 120, yield: 0.65 },
  { name: "Dark Munich Malt", colorLovibond: 18, yield: 0.72 },
  { name: "Flaked Barley", colorLovibond: 2, yield: 0.68 },
  { name: "Flaked Oats", colorLovibond: 1, yield: 0.6 },
  { name: "Flaked Wheat", colorLovibond: 2, yield: 0.7 },
  { name: "Honey Malt", colorLovibond: 25, yield: 0.75 },
  { name: "Lactose (Milk Sugar)", colorLovibond: 0, yield: 1.0 },
  { name: "Melanoidin Malt", colorLovibond: 20, yield: 0.75 },
  { name: "Oats, Malted", colorLovibond: 2, yield: 0.7 },
  { name: "Pale Chocolate Malt", colorLovibond: 220, yield: 0.65 },
  { name: "Smoked Malt", colorLovibond: 9, yield: 0.75 },
  { name: "Special B Malt", colorLovibond: 180, yield: 0.68 },
  { name: "Victory Malt", colorLovibond: 25, yield: 0.73 },
  { name: "White Wheat Malt", colorLovibond: 2, yield: 0.8 },
  { name: "Torrefied Wheat", colorLovibond: 2, yield: 0.78 },
  { name: "Rice Hulls", colorLovibond: 0, yield: 0 },
];

export const HOP_PRESETS: HopPreset[] = [
  // US Hops
  { name: "Cascade", alphaAcidPercent: 5.5, category: "US Hops" },
  { name: "Centennial", alphaAcidPercent: 10, category: "US Hops" },
  { name: "Citra", alphaAcidPercent: 12.5, category: "US Hops" },
  { name: "Mosaic", alphaAcidPercent: 12, category: "US Hops" },
  { name: "Simcoe", alphaAcidPercent: 13, category: "US Hops" },
  { name: "Amarillo", alphaAcidPercent: 9, category: "US Hops" },
  { name: "Magnum", alphaAcidPercent: 14, category: "US Hops" },
  { name: "Northern Brewer", alphaAcidPercent: 8.5, category: "US Hops" },
  { name: "Willamette", alphaAcidPercent: 5.5, category: "US Hops" },
  { name: "Perle", alphaAcidPercent: 8, category: "US Hops" },
  { name: "Columbus", alphaAcidPercent: 15, category: "US Hops" },
  { name: "Tomahawk", alphaAcidPercent: 16, category: "US Hops" },
  { name: "Zeus", alphaAcidPercent: 16, category: "US Hops" },
  { name: "Chinook", alphaAcidPercent: 13, category: "US Hops" },
  { name: "Warrior", alphaAcidPercent: 16, category: "US Hops" },
  { name: "Apollo", alphaAcidPercent: 17, category: "US Hops" },
  { name: "Bravo", alphaAcidPercent: 17, category: "US Hops" },
  {
    name: "CTZ (Columbus/Tomahawk/Zeus)",
    alphaAcidPercent: 15,
    category: "US Hops",
  },
  { name: "Summit", alphaAcidPercent: 17, category: "US Hops" },
  { name: "El Dorado", alphaAcidPercent: 15, category: "US Hops" },
  { name: "Idaho 7", alphaAcidPercent: 13, category: "US Hops" },
  { name: "Sabro", alphaAcidPercent: 16, category: "US Hops" },
  { name: "Strata", alphaAcidPercent: 13, category: "US Hops" },
  { name: "Cashmere", alphaAcidPercent: 9, category: "US Hops" },
  { name: "Comet", alphaAcidPercent: 10, category: "US Hops" },
  { name: "Crystal", alphaAcidPercent: 4, category: "US Hops" },
  { name: "Liberty", alphaAcidPercent: 4.5, category: "US Hops" },
  { name: "Mt. Hood", alphaAcidPercent: 6, category: "US Hops" },
  { name: "Santiam", alphaAcidPercent: 6, category: "US Hops" },
  { name: "Ultra", alphaAcidPercent: 5, category: "US Hops" },
  { name: "Vanguard", alphaAcidPercent: 6, category: "US Hops" },
  { name: "Columbia", alphaAcidPercent: 6, category: "US Hops" },
  { name: "Newport", alphaAcidPercent: 12, category: "US Hops" },

  // Noble Hops (often grown in Germany, Czech Republic, etc.)
  { name: "Saaz", alphaAcidPercent: 3.5, category: "Noble Hops" },
  { name: "Hallertau Mittelfrüh", alphaAcidPercent: 4, category: "Noble Hops" },
  { name: "Spalt", alphaAcidPercent: 5, category: "Noble Hops" },
  { name: "Tettnang", alphaAcidPercent: 4.5, category: "Noble Hops" },

  // New Zealand Hops
  { name: "Nelson Sauvin", alphaAcidPercent: 12, category: "New Zealand Hops" },
  { name: "Motueka", alphaAcidPercent: 7, category: "New Zealand Hops" },
  { name: "Riwaka", alphaAcidPercent: 5.5, category: "New Zealand Hops" },
  { name: "Pacific Gem", alphaAcidPercent: 15, category: "New Zealand Hops" },
  { name: "Styrian Celeia", alphaAcidPercent: 4, category: "New Zealand Hops" },
  { name: "Green Bullet", alphaAcidPercent: 13, category: "New Zealand Hops" },
  { name: "Pacific Jade", alphaAcidPercent: 13, category: "New Zealand Hops" },
  { name: "Rakau", alphaAcidPercent: 10.5, category: "New Zealand Hops" },
  {
    name: "Southern Cross",
    alphaAcidPercent: 13,
    category: "New Zealand Hops",
  },
  { name: "Waimea", alphaAcidPercent: 16, category: "New Zealand Hops" },
  { name: "Kohatu", alphaAcidPercent: 6.5, category: "New Zealand Hops" },
  { name: "Sticklebract", alphaAcidPercent: 10, category: "New Zealand Hops" },
  {
    name: "Pacific Sunrise",
    alphaAcidPercent: 12,
    category: "New Zealand Hops",
  },
  { name: "Dr. Rudi", alphaAcidPercent: 11, category: "New Zealand Hops" },

  // Australian Hops
  { name: "Galaxy", alphaAcidPercent: 14, category: "Australian Hops" },

  // English Hops
  { name: "East Kent Goldings", alphaAcidPercent: 5, category: "English Hops" },
  { name: "Fuggle", alphaAcidPercent: 4.5, category: "English Hops" },
  { name: "Goldings", alphaAcidPercent: 5.5, category: "English Hops" },
  { name: "Challenger", alphaAcidPercent: 7.5, category: "English Hops" },
  { name: "Fuggles", alphaAcidPercent: 4.5, category: "English Hops" },
  { name: "Styrian Goldings", alphaAcidPercent: 4.5, category: "English Hops" },

  // German Hops
  { name: "Hallertau Blanc", alphaAcidPercent: 10, category: "German Hops" },
  { name: "Mandarina Bavaria", alphaAcidPercent: 8.5, category: "German Hops" },
  { name: "Huell Melon", alphaAcidPercent: 7, category: "German Hops" },
  { name: "German Tradition", alphaAcidPercent: 5, category: "German Hops" },
  { name: "German Saphir", alphaAcidPercent: 3.5, category: "German Hops" },
  { name: "German Opal", alphaAcidPercent: 8, category: "German Hops" },
  { name: "German Smaragd", alphaAcidPercent: 5.5, category: "German Hops" },
  { name: "Hersbrucker", alphaAcidPercent: 3.5, category: "German Hops" },
  {
    name: "Northern Brewer (German)",
    alphaAcidPercent: 7,
    category: "German Hops",
  },
  { name: "Spalter Select", alphaAcidPercent: 5.5, category: "German Hops" },
  { name: "Taurus", alphaAcidPercent: 15, category: "German Hops" },
];

export const YEAST_PRESETS: YeastPreset[] = [
  // Escarpment Labs
  { name: "Foggy London Ale", category: "Escarpment Labs", attenuationPercent: 0.75 },
  { name: "Vermont Ale", category: "Escarpment Labs", attenuationPercent: 0.78 },
  { name: "Kölsch", category: "Escarpment Labs", attenuationPercent: 0.78 },
  { name: "California Ale", category: "Escarpment Labs", attenuationPercent: 0.78 },
  { name: "Old World Saison", category: "Escarpment Labs", attenuationPercent: 0.85 },
  { name: "Cry Havoc", category: "Escarpment Labs", attenuationPercent: 0.8 },
  { name: "Brett Brux", category: "Escarpment Labs", attenuationPercent: 0.85 },

  // Wyeast
  { name: "1056 American Ale", category: "Wyeast", attenuationPercent: 0.77 },
  { name: "1318 London Ale III", category: "Wyeast", attenuationPercent: 0.75 },
  { name: "1084 Irish Ale", category: "Wyeast", attenuationPercent: 0.75 },
  { name: "1968 London ESB Ale", category: "Wyeast", attenuationPercent: 0.73 },
  { name: "2565 Kölsch", category: "Wyeast", attenuationPercent: 0.78 },
  { name: "3711 French Saison", category: "Wyeast", attenuationPercent: 0.85 },
  { name: "3787 Trappist High Gravity", category: "Wyeast", attenuationPercent: 0.8 },

  // Fermentis (Standard Dry Yeasts)
  { name: "SafAle US-05", category: "Fermentis", attenuationPercent: 0.78 },
  { name: "SafAle S-04", category: "Fermentis", attenuationPercent: 0.75 },
  { name: "SafLager W-34/70", category: "Fermentis", attenuationPercent: 0.82 },
  { name: "SafCider", category: "Fermentis", attenuationPercent: 1.00 },
  { name: "SafBrew WB-06", category: "Fermentis", attenuationPercent: 0.80 },
  { name: "SafAle K-97", category: "Fermentis", attenuationPercent: 0.75 },

  // Lallemand (Standard Dry Yeasts)
  { name: "LalBrew Nottingham", category: "Lallemand", attenuationPercent: 0.75 },
  { name: "LalBrew BRY-97 American West Coast Ale", category: "Lallemand", attenuationPercent: 0.78 },
  { name: "LalBrew Belle Saison", category: "Lallemand", attenuationPercent: 0.85 },
  { name: "LalBrew Voss Kveik", category: "Lallemand", attenuationPercent: 0.8 },

  // Other Common Yeasts
  { name: "Imperial Organic Yeast A07 Flagship", category: "Imperial Yeast", attenuationPercent: 0.78 },
  { name: "Omega Yeast OYL-004 West Coast Ale I", category: "Omega Yeast", attenuationPercent: 0.78 },
];

const CUSTOM_GRAINS_KEY = "beerapp.customGrains";
const CUSTOM_HOPS_KEY = "beerapp.customHops";
const CUSTOM_YEASTS_KEY = "beerapp.customYeasts";

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

export function getYeastPresets(): YeastPreset[] {
  const custom = loadJson<YeastPreset[]>(CUSTOM_YEASTS_KEY, []);
  return [...YEAST_PRESETS, ...custom];
}

export function addCustomYeast(p: YeastPreset): YeastPreset[] {
  const list = loadJson<YeastPreset[]>(CUSTOM_YEASTS_KEY, []);
  const next = [...list.filter((x) => x.name !== p.name), p];
  saveJson(CUSTOM_YEASTS_KEY, next);
  return [...YEAST_PRESETS, ...next];
}
