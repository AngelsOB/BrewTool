import { loadJson, saveJson } from "./storage";
// Basic water chemistry helpers for salt additions and ion profiles

export type WaterProfile = {
  Ca: number; // ppm
  Mg: number; // ppm
  Na: number; // ppm
  Cl: number; // ppm
  SO4: number; // ppm as sulfate
  HCO3: number; // ppm as bicarbonate
};

export const RO_PROFILE: WaterProfile = {
  Ca: 0,
  Mg: 0,
  Na: 0,
  Cl: 0,
  SO4: 0,
  HCO3: 0,
};

export type SaltAdditions = {
  gypsum_g?: number; // CaSO4·2H2O
  cacl2_g?: number; // CaCl2·2H2O
  epsom_g?: number; // MgSO4·7H2O
  nacl_g?: number; // NaCl
  nahco3_g?: number; // NaHCO3 (baking soda)
};

// Ion contributions per 1 g of salt added to 1 L of water (mg/L aka ppm)
// Mass fractions computed from molar masses.
// 1 g/L = 1000 mg/L, ppm contribution = mass_fraction * 1000
export const ION_PPM_PER_G_PER_L = {
  gypsum: {
    Ca: 0.2328 * 1000, // 40.078 / 172.169
    SO4: 0.5583 * 1000, // 96.061 / 172.169
  },
  cacl2: {
    Ca: 0.2726 * 1000, // 40.078 / 147.014
    Cl: 0.482 * 1000, // 70.906 / 147.014
  },
  epsom: {
    Mg: 0.0986 * 1000, // 24.305 / 246.471
    SO4: 0.3896 * 1000, // 96.061 / 246.471
  },
  nacl: {
    Na: 0.3934 * 1000, // 22.990 / 58.443
    Cl: 0.6066 * 1000, // 35.453 / 58.443
  },
  nahco3: {
    Na: 0.2737 * 1000, // 22.990 / 84.006
    HCO3: 0.7263 * 1000, // 61.016 / 84.006 (as bicarbonate)
  },
} as const;

export function addProfiles(a: WaterProfile, b: WaterProfile): WaterProfile {
  return {
    Ca: a.Ca + b.Ca,
    Mg: a.Mg + b.Mg,
    Na: a.Na + b.Na,
    Cl: a.Cl + b.Cl,
    SO4: a.SO4 + b.SO4,
    HCO3: a.HCO3 + b.HCO3,
  };
}

export function subtractProfiles(
  a: WaterProfile,
  b: WaterProfile
): WaterProfile {
  return {
    Ca: a.Ca - b.Ca,
    Mg: a.Mg - b.Mg,
    Na: a.Na - b.Na,
    Cl: a.Cl - b.Cl,
    SO4: a.SO4 - b.SO4,
    HCO3: a.HCO3 - b.HCO3,
  };
}

export function scaleProfile(p: WaterProfile, factor: number): WaterProfile {
  return {
    Ca: p.Ca * factor,
    Mg: p.Mg * factor,
    Na: p.Na * factor,
    Cl: p.Cl * factor,
    SO4: p.SO4 * factor,
    HCO3: p.HCO3 * factor,
  };
}

export function zeroProfile(): WaterProfile {
  return { ...RO_PROFILE };
}

// Compute ion delta (ppm) contributed by the given salts at a specific water volume.
// grams are total grams added to that volume, not per liter.
export function ionDeltaFromSalts(
  add: SaltAdditions,
  volumeL: number
): WaterProfile {
  const v = Math.max(0.0001, volumeL);
  const perL = (g?: number) => (g && g > 0 ? g / v : 0); // g/L
  const gyp = perL(add.gypsum_g);
  const cac = perL(add.cacl2_g);
  const eps = perL(add.epsom_g);
  const nac = perL(add.nacl_g);
  const nah = perL(add.nahco3_g);

  return {
    Ca:
      gyp * ION_PPM_PER_G_PER_L.gypsum.Ca + cac * ION_PPM_PER_G_PER_L.cacl2.Ca,
    Mg: eps * ION_PPM_PER_G_PER_L.epsom.Mg,
    Na: nac * ION_PPM_PER_G_PER_L.nacl.Na + nah * ION_PPM_PER_G_PER_L.nahco3.Na,
    Cl: cac * ION_PPM_PER_G_PER_L.cacl2.Cl + nac * ION_PPM_PER_G_PER_L.nacl.Cl,
    SO4:
      gyp * ION_PPM_PER_G_PER_L.gypsum.SO4 +
      eps * ION_PPM_PER_G_PER_L.epsom.SO4,
    HCO3: nah * ION_PPM_PER_G_PER_L.nahco3.HCO3,
  };
}

export function clampProfile(p: WaterProfile): WaterProfile {
  return {
    Ca: Math.max(0, p.Ca),
    Mg: Math.max(0, p.Mg),
    Na: Math.max(0, p.Na),
    Cl: Math.max(0, p.Cl),
    SO4: Math.max(0, p.SO4),
    HCO3: Math.max(0, p.HCO3),
  };
}

export function mixProfiles(
  volumesAndProfiles: Array<{ volumeL: number; profile: WaterProfile }>
): WaterProfile {
  const totalV = volumesAndProfiles.reduce(
    (s, x) => s + Math.max(0, x.volumeL),
    0
  );
  if (totalV <= 0.0001) return zeroProfile();
  const sum = volumesAndProfiles.reduce(
    (acc, { volumeL, profile }) => ({
      Ca: acc.Ca + profile.Ca * volumeL,
      Mg: acc.Mg + profile.Mg * volumeL,
      Na: acc.Na + profile.Na * volumeL,
      Cl: acc.Cl + profile.Cl * volumeL,
      SO4: acc.SO4 + profile.SO4 * volumeL,
      HCO3: acc.HCO3 + profile.HCO3 * volumeL,
    }),
    zeroProfile()
  );
  return scaleProfile(sum, 1 / totalV);
}

export function chlorideToSulfateRatio(profile: WaterProfile): number | null {
  const { Cl, SO4 } = profile;
  if (SO4 <= 0) return null;
  return Cl / SO4;
}

export const COMMON_WATER_PROFILES: Record<string, WaterProfile> = {
  RO: RO_PROFILE,
  Pilsen: { Ca: 7, Mg: 3, Na: 2, Cl: 5, SO4: 5, HCO3: 15 },
  Dortmund: { Ca: 225, Mg: 40, Na: 60, Cl: 180, SO4: 120, HCO3: 180 },
  Burton: { Ca: 275, Mg: 40, Na: 25, Cl: 35, SO4: 470, HCO3: 300 },
  Dublin: { Ca: 120, Mg: 4, Na: 12, Cl: 19, SO4: 53, HCO3: 319 },
  Vienna: { Ca: 163, Mg: 12, Na: 10, Cl: 40, SO4: 125, HCO3: 258 },
};

export const ION_KEYS: Array<keyof WaterProfile> = [
  "Ca",
  "Mg",
  "Na",
  "Cl",
  "SO4",
  "HCO3",
];

export const DEFAULT_TOLERANCE_PPM = 20;

// ==========================
// Saved custom water profiles (localStorage)
// ==========================

export type SavedWaterProfile = {
  id: string;
  name: string;
  profile: WaterProfile;
};

const SAVED_WATER_PROFILES_KEY = "beerapp.waterProfiles";

export function loadSavedWaterProfiles(): SavedWaterProfile[] {
  return loadJson<SavedWaterProfile[]>(SAVED_WATER_PROFILES_KEY, []);
}

export function saveNewWaterProfile(
  name: string,
  profile: WaterProfile
): SavedWaterProfile {
  const list = loadSavedWaterProfiles();
  const item: SavedWaterProfile = { id: crypto.randomUUID(), name, profile };
  const next = [item, ...list];
  saveJson(SAVED_WATER_PROFILES_KEY, next);
  return item;
}

export function updateSavedWaterProfile(
  id: string,
  name: string,
  profile: WaterProfile
): SavedWaterProfile | null {
  const list = loadSavedWaterProfiles();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const updated: SavedWaterProfile = { id, name, profile };
  const next = [...list.slice(0, idx), updated, ...list.slice(idx + 1)];
  saveJson(SAVED_WATER_PROFILES_KEY, next);
  return updated;
}

export function deleteSavedWaterProfile(id: string): void {
  const list = loadSavedWaterProfiles();
  const next = list.filter((x) => x.id !== id);
  saveJson(SAVED_WATER_PROFILES_KEY, next);
}
