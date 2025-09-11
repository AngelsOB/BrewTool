import { loadJson, saveJson } from "../utils/storage";
import type { BrewingDataStore, Recipe, EquipmentProfile } from "./recipe";
import type { SavedWaterProfile } from "../utils/water";

const RECIPES_KEY = "beerapp.recipes";
const EQUIPMENT_KEY = "beerapp.equipment";
const FERMENTABLES_KEY = "beerapp.ingredients.fermentables";
const HOPS_KEY = "beerapp.ingredients.hops";
const YEASTS_KEY = "beerapp.ingredients.yeasts";
const WATER_PROFILES_KEY = "beerapp.waterProfiles";

// Minimal localStorage-backed store. Not reactive; callers should wrap as needed.
export function createLocalBrewingDataStore(): BrewingDataStore {
  return {
    recipes: {
      list: () => loadJson<Recipe[]>(RECIPES_KEY, []),
      get: (id: string) =>
        loadJson<Recipe[]>(RECIPES_KEY, []).find((r) => r.id === id) ?? null,
      save: (recipe: Recipe) => {
        const list = loadJson<Recipe[]>(RECIPES_KEY, []);
        const idx = list.findIndex((r) => r.id === recipe.id);
        const next =
          idx >= 0
            ? [...list.slice(0, idx), recipe, ...list.slice(idx + 1)]
            : [recipe, ...list];
        saveJson(RECIPES_KEY, next);
      },
      delete: (id: string) => {
        const list = loadJson<Recipe[]>(RECIPES_KEY, []);
        saveJson(
          RECIPES_KEY,
          list.filter((r) => r.id !== id)
        );
      },
    },
    equipment: {
      list: () => loadJson<EquipmentProfile[]>(EQUIPMENT_KEY, []),
      get: (id: string) =>
        loadJson<EquipmentProfile[]>(EQUIPMENT_KEY, []).find(
          (e) => e.id === id
        ) ?? null,
      save: (profile: EquipmentProfile) => {
        const list = loadJson<EquipmentProfile[]>(EQUIPMENT_KEY, []);
        const idx = list.findIndex((e) => e.id === profile.id);
        const next =
          idx >= 0
            ? [...list.slice(0, idx), profile, ...list.slice(idx + 1)]
            : [profile, ...list];
        saveJson(EQUIPMENT_KEY, next);
      },
      delete: (id: string) => {
        const list = loadJson<EquipmentProfile[]>(EQUIPMENT_KEY, []);
        saveJson(
          EQUIPMENT_KEY,
          list.filter((e) => e.id !== id)
        );
      },
    },
    ingredients: {
      fermentables: {
        list: () => loadJson<any[]>(FERMENTABLES_KEY, []),
        get: (id: string) =>
          loadJson<any[]>(FERMENTABLES_KEY, []).find((x) => x.id === id) ??
          null,
        save: (ingredient: any) => {
          const list = loadJson<any[]>(FERMENTABLES_KEY, []);
          const idx = list.findIndex((e) => e.id === ingredient.id);
          const next =
            idx >= 0
              ? [...list.slice(0, idx), ingredient, ...list.slice(idx + 1)]
              : [ingredient, ...list];
          saveJson(FERMENTABLES_KEY, next);
        },
      },
      hops: {
        list: () => loadJson<any[]>(HOPS_KEY, []),
        get: (id: string) =>
          loadJson<any[]>(HOPS_KEY, []).find((x) => x.id === id) ?? null,
        save: (ingredient: any) => {
          const list = loadJson<any[]>(HOPS_KEY, []);
          const idx = list.findIndex((e) => e.id === ingredient.id);
          const next =
            idx >= 0
              ? [...list.slice(0, idx), ingredient, ...list.slice(idx + 1)]
              : [ingredient, ...list];
          saveJson(HOPS_KEY, next);
        },
      },
      yeasts: {
        list: () => loadJson<any[]>(YEASTS_KEY, []),
        get: (id: string) =>
          loadJson<any[]>(YEASTS_KEY, []).find((x) => x.id === id) ?? null,
        save: (ingredient: any) => {
          const list = loadJson<any[]>(YEASTS_KEY, []);
          const idx = list.findIndex((e) => e.id === ingredient.id);
          const next =
            idx >= 0
              ? [...list.slice(0, idx), ingredient, ...list.slice(idx + 1)]
              : [ingredient, ...list];
          saveJson(YEASTS_KEY, next);
        },
      },
    },
    water: {
      profiles: {
        list: () => loadJson<SavedWaterProfile[]>(WATER_PROFILES_KEY, []),
        save: (profile: SavedWaterProfile) => {
          const list = loadJson<SavedWaterProfile[]>(WATER_PROFILES_KEY, []);
          const idx = list.findIndex((p) => p.id === profile.id);
          const next =
            idx >= 0
              ? [...list.slice(0, idx), profile, ...list.slice(idx + 1)]
              : [profile, ...list];
          saveJson(WATER_PROFILES_KEY, next);
        },
        delete: (id: string) => {
          const list = loadJson<SavedWaterProfile[]>(WATER_PROFILES_KEY, []);
          saveJson(
            WATER_PROFILES_KEY,
            list.filter((p) => p.id !== id)
          );
        },
      },
    },
  };
}
