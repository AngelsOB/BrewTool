import { create } from "zustand";
import { loadJson, saveJson } from "../utils/storage";
import type { HopFlavorProfile } from "../utils/presets";

export type GrainItem = {
  id: string;
  name: string;
  weightKg: number; // kilograms
  colorLovibond: number; // °L
  yield: number; // as a decimal, e.g., 0.75 for 75%
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
};

export type YeastItem = {
  name: string;
  attenuationPercent?: number;
};

export type Recipe = {
  id: string;
  name: string;
  createdAt: string;
  batchVolumeL: number;
  targetOG?: number;
  targetFG?: number;
  grains: GrainItem[];
  hops: HopItem[];
  yeast?: YeastItem;
  notes?: string;
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
