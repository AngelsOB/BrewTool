import { create } from "zustand";
import { loadJson, saveJson } from "../utils/storage";
import type { Recipe } from "../types/recipe";

type State = {
  recipes: Recipe[];
  upsert: (recipe: Recipe) => void;
  remove: (id: string) => void;
};

const STORAGE_KEY = "beerapp.recipes";

export const useRecipeStore = create<State>((set, get) => ({
  recipes: (() => {
    const existing = loadJson<Recipe[]>(STORAGE_KEY, []);
    if (existing && existing.length > 0) return existing;
    const demo = createDemoRecipePaterbier();
    const seeded = [demo];
    saveJson(STORAGE_KEY, seeded);
    return seeded;
  })(),
  upsert: (recipe) => {
    const list = get().recipes;
    const idx = list.findIndex((r) => r.id === recipe.id);
    const now = new Date().toISOString();
    const withTimestamps: Recipe = {
      ...recipe,
      updatedAt: now,
    };
    const next =
      idx >= 0
        ? [...list.slice(0, idx), withTimestamps, ...list.slice(idx + 1)]
        : [withTimestamps, ...list];
    saveJson(STORAGE_KEY, next);
    set({ recipes: next });
  },
  remove: (id) => {
    const next = get().recipes.filter((r) => r.id !== id);
    saveJson(STORAGE_KEY, next);
    set({ recipes: next });
  },
}));

function createDemoRecipePaterbier(): Recipe {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;
  return {
    id,
    name: "Mini 🇧🇪 Tripel - Pseudo Belgian Single / Patersbier",
    createdAt: now,
    updatedAt: now,
    version: 1,
    bjcpStyleCode: "26B", // Belg. Single/Patersbier closest (Belgian Ale family)
    targetProfile: {
      batchVolumeL: 21,
      originalGravity: 1.056,
      finalGravity: 1.008,
      abv: 6.2,
      ibu: 29,
      srm: 3.5,
    },
    equipment: {
      profileId: "default",
      snapshotAt: now,
      snapshot: {
        id: "default",
        name: "Default Equipment",
        type: "all-grain",
        volumes: {
          batchVolumeL: 21,
          boilVolumeL: 25,
          fermenterVolumeL: 22,
          mashTunVolumeL: 30,
          kettleDeadspaceL: 0.5,
          lauterDeadspaceL: 0,
        },
        efficiency: { mashEfficiencyPct: 75, brewHouseEfficiencyPct: 70 },
        losses: {
          evaporationRateLPerHour: 3,
          kettleDeadspaceL: 0.5,
          grainAbsorptionLPerKg: 0.8,
          hopsAbsorptionLPerKg: 0.7,
          coolingShrinkagePct: 4,
          miscLossL: 0.5,
          fermenterLossL: 1,
        },
        thermal: {
          mashTunTempLossPerHour: 1,
          grainTempC: 20,
          mashThicknessLPerKg: 3,
        },
        timing: { boilTimeMin: 60, mashTimeMin: 60 },
        calibration: {
          hydrometerOffsetPoints: 0,
          wortCorrectionFactor: 1,
          hopUtilizationFactor: 1,
        },
        equipment: {},
      },
    },
    processSettings: {
      mashEfficiencyPct: 75,
      ibuCalculationMethod: "tinseth",
      colorCalculationMethod: "morey",
      hopUtilizationFactor: 1,
      brewMethod: "three-vessel",
    },
    ingredients: {
      fermentables: [
        // 9.5 lb Belgian Pilsner ≈ 4.309 kg
        {
          id: "piln",
          ingredientRef: {
            type: "preset",
            id: "Dingemans - Belgian Pilsner Malt",
          },
          amountKg: 4.309,
          usage: { timing: "mash" },
        },
        // 0.5 lb Aromatic ≈ 0.227 kg
        {
          id: "arom",
          ingredientRef: {
            type: "preset",
            id: "Dingemans - Aromatic Malt",
          },
          amountKg: 0.227,
          usage: { timing: "mash" },
        },
        // 0.75 lb Flaked Corn ≈ 0.340 kg
        {
          id: "corn",
          ingredientRef: { type: "preset", id: "Flaked Corn" },
          amountKg: 0.34,
          usage: { timing: "mash" },
        },
        // 1.0 lb Candi Syrup D-45 ≈ 0.454 kg, added in fermenter
        {
          id: "d45",
          ingredientRef: {
            type: "preset",
            id: "Candi Syrup - Belgian Candi Syrup - D-45",
          },
          amountKg: 0.454,
          usage: { timing: "fermentation" },
        },
      ],
      hops: [
        // 0.5 oz Saaz @ FWH ≈ 14 g, AA ~3.5
        {
          id: "h1",
          ingredientRef: { type: "preset", id: "Saaz" },
          amountG: 14,
          usage: { timing: "first-wort", timeMin: 60 },
          overrides: { alphaAcidPct: 3.5 },
        },
        // 0.5 oz Hallertau Mittelfrüh @60 ≈ 14 g, AA ~4.0
        {
          id: "h2",
          ingredientRef: { type: "preset", id: "Hallertau Mittelfrüh" },
          amountG: 14,
          usage: { timing: "boil", timeMin: 60 },
          overrides: { alphaAcidPct: 4.0 },
        },
        // 0.5 oz Hallertau Mittelfrüh @15 ≈ 14 g
        {
          id: "h3",
          ingredientRef: { type: "preset", id: "Hallertau Mittelfrüh" },
          amountG: 14,
          usage: { timing: "boil", timeMin: 15 },
          overrides: { alphaAcidPct: 4.0 },
        },
        // 0.25 oz Tettnang @15 ≈ 7 g, AA ~4.5
        {
          id: "h4",
          ingredientRef: { type: "preset", id: "Tettnang" },
          amountG: 7,
          usage: { timing: "boil", timeMin: 15 },
          overrides: { alphaAcidPct: 4.5 },
        },
        // 0.75 oz Tettnang @5 ≈ 21.26 g
        {
          id: "h5",
          ingredientRef: { type: "preset", id: "Tettnang" },
          amountG: 21.3,
          usage: { timing: "boil", timeMin: 5 },
          overrides: { alphaAcidPct: 4.5 },
        },
      ],
      yeast: {
        ingredientRef: { type: "preset", id: "WLP530 Abbey Ale Yeast" },
        form: "liquid",
        quantity: {},
        starter: {
          steps: [
            {
              id: "ys1",
              volumeL: 1,
              gravityPoints: 40,
              timeHours: 0,
              temperature: 0,
              agitation: "stir-plate",
            },
          ],
          totalVolumeL: 1,
          totalDmeG: 0,
          estimatedViableCells: 0,
        },
        overrides: { attenuationPct: 82 },
      },
      other: [
        {
          id: "campden",
          ingredientRef: { type: "preset", id: "Campden Tablets" },
          amount: 1,
          unit: "tablet",
          timing: "boil",
          notes: "Chlorine/chloramine removal",
        },
      ],
      water: {
        sourceProfile: { Ca: 31, Mg: 8, Na: 15, Cl: 26, SO4: 22, HCO3: 0 }, // Montreal
        targetProfile: { Ca: 60, Mg: 6, Na: 18, Cl: 79, SO4: 62, HCO3: 47 }, // Belgian Ale
        salts: {
          gypsumG: 2,
          calciumChlorideG: 3,
          epsomSaltG: 0,
          tableSaltG: 0.3,
          bakingSodaG: 1,
        },
        acids: {},
      },
    },
    process: {
      mash: {
        method: "single-infusion",
        steps: [
          {
            id: "m1",
            name: "Saccharification",
            type: "infusion",
            targetTempC: 64,
            timeMin: 60,
          },
        ],
        grainAbsorptionLPerKg: 0.8,
        mashTunDeadSpaceL: 0.5,
      },
      fermentation: {
        steps: [
          {
            id: "f1",
            name: "Primary start",
            stage: "primary",
            temperatureC: 19,
            durationDays: 3,
          },
          {
            id: "f2",
            name: "Free rise",
            stage: "primary",
            temperatureC: 23,
            durationDays: 21,
            notes:
              "let free rise to 23°C and complete fermentation. 3-4 weeks.",
          },
        ],
        estimatedDays: 24,
      },
      packaging: {
        method: "keg",
        carbonation: { co2Volumes: 2.2, method: "forced" },
        servingTempC: 2,
      },
    },
    preferences: {
      displayUnits: "metric",
      preferredIbuMethod: "tinseth",
      preferredColorMethod: "morey",
      sugarScale: "sg",
    },
    brewSessions: [],
    calculated: {
      originalGravity: 1.056,
      finalGravity: 1.008,
      abv: 6.2,
      ibuTinseth: 29,
      ibuRager: 29,
      ibuGaretz: 29,
      srmMorey: 3.5,
      srmDaniels: 3.5,
      srmMosher: 3.5,
      preboilVolumeL: 25,
      postboilVolumeL: 21,
      mashWaterL: 14.6,
      spargeWaterL: 10.4,
      totalWaterL: 25,
      calories: 0,
      realExtract: 0,
      apparentAttenuation: 0,
      lastCalculated: now,
    },
  };
}

export function createEmptyRecipe(name: string): Recipe {
  const now = new Date().toISOString();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    version: 1,
    bjcpStyleCode: undefined,
    targetProfile: {
      batchVolumeL: 20,
      originalGravity: 1.05,
      finalGravity: 1.01,
    },
    equipment: {
      profileId: "default",
      snapshotAt: now,
      snapshot: {
        id: "default",
        name: "Default Equipment",
        type: "all-grain",
        volumes: {
          batchVolumeL: 20,
          boilVolumeL: 25,
          fermenterVolumeL: 23,
          kettleDeadspaceL: 0.5,
          mashTunVolumeL: 30,
          lauterDeadspaceL: 0,
        },
        efficiency: {
          mashEfficiencyPct: 75,
          brewHouseEfficiencyPct: 70,
        },
        losses: {
          evaporationRateLPerHour: 3,
          kettleDeadspaceL: 0.5,
          grainAbsorptionLPerKg: 0.8,
          hopsAbsorptionLPerKg: 0.7,
          coolingShrinkagePct: 4,
          miscLossL: 0.5,
          fermenterLossL: 1,
        },
        thermal: {
          mashTunTempLossPerHour: 1,
          grainTempC: 20,
          mashThicknessLPerKg: 3,
        },
        timing: {
          boilTimeMin: 60,
          mashTimeMin: 60,
        },
        calibration: {
          hydrometerOffsetPoints: 0,
          wortCorrectionFactor: 1,
          hopUtilizationFactor: 1,
        },
        equipment: {},
      },
    },
    processSettings: {
      mashEfficiencyPct: 75,
      ibuCalculationMethod: "tinseth",
      colorCalculationMethod: "morey",
      hopUtilizationFactor: 1,
      brewMethod: "three-vessel",
    },
    ingredients: {
      fermentables: [],
      hops: [],
      yeast: null,
      other: [],
    },
    process: {
      mash: undefined,
      fermentation: { steps: [], estimatedDays: 0 },
      packaging: undefined,
    },
    preferences: {
      displayUnits: "metric",
      preferredIbuMethod: "tinseth",
      preferredColorMethod: "morey",
      sugarScale: "sg",
    },
    brewSessions: [],
    calculated: {
      originalGravity: 1.05,
      finalGravity: 1.01,
      abv: 0,
      ibuTinseth: 0,
      ibuRager: 0,
      ibuGaretz: 0,
      srmMorey: 0,
      srmDaniels: 0,
      srmMosher: 0,
      preboilVolumeL: 20,
      postboilVolumeL: 20,
      mashWaterL: 0,
      spargeWaterL: 0,
      totalWaterL: 0,
      calories: 0,
      realExtract: 0,
      apparentAttenuation: 0,
      lastCalculated: now,
    },
  };
}
