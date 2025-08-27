import { create } from "zustand";
import { loadJson, saveJson } from "../utils/storage";
import type { HopFlavorProfile } from "../utils/presets";
import type { WaterParams } from "../utils/calculations";

export type GrainItem = {
  id: string;
  name: string;
  weightKg: number; // kilograms
  colorLovibond: number; // °L
  potentialGu: number; // GU/PPG at 100% conversion (as-is)
  type: "grain" | "adjunct_mashable" | "extract" | "sugar";
  fermentability?: number; // 0..1 optional override
  // Custom name flow mirrors OtherIngredient custom UX
  customNameLocked?: boolean;
  customNameSelected?: boolean;
};

export type HopTimingType =
  | "boil"
  | "dry hop"
  | "whirlpool"
  | "first wort"
  | "mash";

export type HopItem = {
  id: string;
  name: string;
  grams: number;
  alphaAcidPercent: number; // %
  timeMin: number; // boil minutes
  category?: string; // Optional category, e.g., "US Hops", "Noble Hops", "New Zealand Hops"
  type: HopTimingType;
  flavor?: HopFlavorProfile; // optional sensory profile copied from preset
  // Custom name flow mirrors OtherIngredient custom UX
  customNameLocked?: boolean;
  customNameSelected?: boolean;
  // Extra timing metadata per addition type
  // Dry hop specifics
  dryHopStage?: "primary" | "post-fermentation" | "keg";
  dryHopDays?: number;
  // Whirlpool specifics
  whirlpoolTempC?: number;
  whirlpoolTimeMin?: number;
};

export type YeastItem = {
  name: string;
  attenuationPercent?: number;
};

export type MashStep = {
  id: string;
  type: "infusion" | "decoction" | "ramp";
  tempC: number;
  timeMin: number;
  decoctionPercent?: number; // only for type 'decoction'
};

export type FermentationStep = {
  id: string;
  stage:
    | "primary"
    | "secondary"
    | "diacetyl-rest"
    | "conditioning"
    | "cold-crash"
    | "lagering"
    | "keg-conditioning"
    | "bottle-conditioning"
    | "spunding";
  tempC: number;
  days: number;
  pressurePsi?: number;
  notes?: string;
  dryHopReminder?: boolean;
};

export type OtherIngredientCategory =
  | "water-agent"
  | "fining"
  | "spice"
  | "flavor"
  | "herb"
  | "other";

export type OtherIngredient = {
  id: string;
  name: string;
  category: OtherIngredientCategory;
  amount: number;
  unit: string; // g, tsp, tbsp, oz, ml, etc.
  timing: "mash" | "boil" | "whirlpool" | "secondary" | "kegging" | "bottling";
  notes?: string;
  // When true, permanently use custom name input and hide preset dropdown for this row
  customNameLocked?: boolean;
  // When true, user selected the Custom option, show editable input until locked
  customNameSelected?: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  createdAt: string;
  // Optional BJCP style selection
  bjcpStyleCode?: string; // e.g., "21A", "X5"
  batchVolumeL: number;
  efficiencyPct?: number;
  targetOG?: number;
  targetFG?: number;
  grains: GrainItem[];
  hops: HopItem[];
  yeast?: YeastItem;
  mash?: { tempC?: number; timeMin?: number; steps?: MashStep[] };
  fermentation?: { steps: FermentationStep[] };
  others?: OtherIngredient[];
  notes?: string;
  water?: WaterParams & {
    // Cached computed values for convenience when viewing a saved recipe
    mashWaterL?: number;
    spargeWaterL?: number;
    preBoilVolumeL?: number;
  };
  brewMethod?: "three-vessel" | "biab-full" | "biab-sparge";
};

type State = {
  recipes: Recipe[];
  upsert: (recipe: Recipe) => void;
  remove: (id: string) => void;
};

const STORAGE_KEY = "beerapp.recipes";

export const useRecipeStore = create<State>((set, get) => ({
  recipes: loadJson<Recipe[]>(STORAGE_KEY, []),
  upsert: (recipe) => {
    const list = get().recipes;
    const idx = list.findIndex((r) => r.id === recipe.id);
    const next =
      idx >= 0
        ? [...list.slice(0, idx), recipe, ...list.slice(idx + 1)]
        : [recipe, ...list];
    saveJson(STORAGE_KEY, next);
    set({ recipes: next });
  },
  remove: (id) => {
    const next = get().recipes.filter((r) => r.id !== id);
    saveJson(STORAGE_KEY, next);
    set({ recipes: next });
  },
}));
