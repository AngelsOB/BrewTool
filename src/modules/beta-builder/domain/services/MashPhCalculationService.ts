/**
 * Mash pH Calculation Service
 *
 * Predicts mash pH using the grain-type acidity model:
 * 1. Classify each grain by pH category
 * 2. Calculate weighted distilled-water pH from grain bill
 * 3. Apply Residual Alkalinity (RA) correction from water chemistry
 *
 * References: Bru'n Water, Brewfather, Kai Troester's pH research
 */

import type { Recipe, Fermentable } from '../models/Recipe';
import type { WaterProfile, SaltAdditions } from './WaterChemistryService';
import { waterChemistryService } from './WaterChemistryService';

/* ------------------------------------------------------------------ */
/*  Grain pH classification                                            */
/* ------------------------------------------------------------------ */

export type GrainPhCategory =
  | 'base'
  | 'wheat'
  | 'munich'
  | 'crystal'
  | 'roasted'
  | 'acidulated'
  | 'adjunct';

/** Distilled-water mash pH ranges per grain category */
const GRAIN_DI_PH: Record<GrainPhCategory, { min: number; max: number }> = {
  base:       { min: 5.65, max: 5.72 },
  wheat:      { min: 5.55, max: 5.65 },
  munich:     { min: 5.45, max: 5.55 },
  crystal:    { min: 4.50, max: 5.20 },
  roasted:    { min: 4.50, max: 4.80 },
  acidulated: { min: 3.30, max: 3.50 },
  adjunct:    { min: 5.70, max: 5.80 },
};

/**
 * Classify a grain into a pH category based on its name and color.
 *
 * The `type` parameter is optional — it exists on FermentablePreset but
 * not on the Fermentable domain model, so we rely primarily on name heuristics.
 */
export function classifyGrainForPh(
  name: string,
  colorLovibond: number,
  type?: string,
): GrainPhCategory {
  const n = name.toLowerCase();

  // Acidulated malt (very specific, check first)
  if (n.includes('acidulated') || n.includes('acid malt') || n.includes('sauermalz')) {
    return 'acidulated';
  }

  // Extract and sugar are not mashed — but if they somehow reach here, treat as adjunct
  if (type === 'extract' || type === 'sugar') {
    return 'adjunct';
  }

  // Roasted malts (check before crystal to catch "carafa")
  if (
    n.includes('roasted') ||
    n.includes('black malt') ||
    n.includes('black patent') ||
    n.includes('black barley') ||
    n.includes('chocolate') ||
    n.includes('carafa') ||
    n.includes('midnight wheat') ||
    n.includes('blackprinz') ||
    n.includes('dehusked') ||
    colorLovibond >= 300
  ) {
    return 'roasted';
  }

  // Crystal / Caramel malts
  if (
    n.includes('crystal') ||
    n.includes('caramel') ||
    n.includes('caramunich') ||
    n.includes('carapils') ||
    n.includes('carahell') ||
    n.includes('caravienne') ||
    n.includes('caraaroma') ||
    n.includes('carafoam') ||
    n.includes('carastan') ||
    n.includes('carared') ||
    n.includes('special b') ||
    (n.includes('cara') && !n.includes('carafa'))
  ) {
    return 'crystal';
  }

  // Wheat
  if (
    n.includes('wheat') ||
    n.includes('weizen') ||
    n.includes('white wheat') ||
    n.includes('red wheat')
  ) {
    return 'wheat';
  }

  // Munich / Vienna
  if (
    n.includes('munich') ||
    n.includes('vienna')
  ) {
    return 'munich';
  }

  // Adjuncts
  if (
    type === 'adjunct_mashable' ||
    n.includes('flaked') ||
    n.includes('torrified') ||
    n.includes('rice hull') ||
    n.includes('corn') ||
    n.includes('rice')
  ) {
    return 'adjunct';
  }

  // Default: base malt
  return 'base';
}

/**
 * Get the distilled-water mash pH for a grain based on its category and color.
 *
 * For crystal and roasted malts, interpolates within the DI pH range
 * based on color (darker = lower pH).
 */
export function getGrainDiPh(category: GrainPhCategory, colorLovibond: number): number {
  const range = GRAIN_DI_PH[category];

  if (category === 'crystal') {
    // Interpolate: 10L → 5.20, 120L+ → 4.50
    const minColor = 10;
    const maxColor = 120;
    const t = Math.min(1, Math.max(0, (colorLovibond - minColor) / (maxColor - minColor)));
    return range.max - t * (range.max - range.min);
  }

  if (category === 'roasted') {
    // Interpolate: 300L → 4.80, 600L+ → 4.50
    const minColor = 300;
    const maxColor = 600;
    const t = Math.min(1, Math.max(0, (colorLovibond - minColor) / (maxColor - minColor)));
    return range.max - t * (range.max - range.min);
  }

  // All other categories: return midpoint
  return (range.min + range.max) / 2;
}

/* ------------------------------------------------------------------ */
/*  Water chemistry helpers                                            */
/* ------------------------------------------------------------------ */

/**
 * Calculate Residual Alkalinity (RA) in ppm as CaCO3.
 *
 * RA = Alkalinity_as_CaCO3 − Ca/2.5 − Mg/3.33
 * Where Alkalinity_as_CaCO3 = HCO3_ppm × 50 / 61.016
 *
 * Positive RA → raises mash pH
 * Negative RA → lowers mash pH
 */
export function calculateResidualAlkalinity(profile: WaterProfile): number {
  const alkalinity = profile.HCO3 * 50 / 61.016;
  return alkalinity - (profile.Ca / 2.5) - (profile.Mg / 3.33);
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

/**
 * RA-to-pH conversion coefficient.
 *
 * Based on Kolbach's research: ~0.003 pH units per ppm RA (as CaCO3)
 * at a standard mash thickness of 3.0 L/kg. Scaled linearly with
 * mash thickness (thinner mash = more water influence).
 */
const RA_PH_COEFFICIENT = 0.003;

/** Standard mash thickness for RA coefficient (L/kg) */
const STANDARD_THICKNESS_L_PER_KG = 3.0;

/**
 * Default mash pH target (room temperature measurement).
 * Literature consensus: 5.4 is the standard default used by Brewfather/BeerSmith.
 * Acceptable range is 5.2–5.6, with 5.2–5.4 being ideal for most styles.
 */
export const DEFAULT_TARGET_PH = 5.4;

/** Acceptable mash pH range */
export const MASH_PH_RANGE = { min: 5.2, max: 5.6 } as const;

/** Ideal mash pH range (green zone in UI) */
export const MASH_PH_IDEAL = { min: 5.2, max: 5.4 } as const;

/* ------------------------------------------------------------------ */
/*  Acid / base adjustment constants                                   */
/* ------------------------------------------------------------------ */

/**
 * Kolbach's factor: grams of 88% lactic acid per kg of grain
 * to lower mash pH by 0.1 units at standard mash thickness (~3 L/kg).
 *
 * Source: Kolbach (1951), confirmed by Kai Troester's experiments.
 */
const LACTIC_88_G_PER_KG_PER_01_PH = 0.66;

/** Density of 88% lactic acid in g/mL */
const LACTIC_88_DENSITY_G_PER_ML = 1.209;

/**
 * Baking soda (NaHCO3) contributes ~726 ppm HCO3 per g/L.
 * Molar mass NaHCO3 = 84.006 g/mol, HCO3 fraction = 61.016/84.006 ≈ 0.7263.
 * Each gram in 1L → 726.3 ppm HCO3.
 *
 * We estimate the pH-raising effect through RA:
 * +1g NaHCO3 per L → +726 ppm HCO3 → +595 ppm alkalinity as CaCO3
 * → +595 * 0.003 = +1.79 pH units per g/L (at standard thickness).
 *
 * Inverted: to raise pH by 0.1, you need ~0.056 g/L of baking soda,
 * or equivalently 0.056 * mashWaterL grams total.
 *
 * More practically, we solve it via the same RA framework:
 * grams_needed = (pH_delta / 0.1) * (totalGrainKg * factor) but for
 * base additions we go through the RA path for consistency.
 */

/**
 * Mash pH adjustment recommendation.
 * Only one of lacticAcid88Ml / bakingSodaG will be > 0.
 */
export type MashPhAdjustment = {
  /** Target pH for the adjustment */
  targetPh: number;
  /** mL of 88% lactic acid to add to lower pH (0 if pH needs raising) */
  lacticAcid88Ml: number;
  /** grams of baking soda (NaHCO3) to add to raise pH (0 if pH needs lowering) */
  bakingSodaG: number;
};

export class MashPhCalculationService {
  /**
   * Predict mash pH for a recipe.
   *
   * @param recipe The recipe with fermentables and optional water chemistry
   * @param mashWaterL Mash water volume in liters (from volume calculations)
   * @returns Estimated mash pH, or null if insufficient data
   */
  calculateMashPh(recipe: Recipe, mashWaterL: number): number | null {
    const grainPh = this.calculateGrainOnlyPh(recipe.fermentables);
    if (grainPh == null) return null;

    // If no water chemistry, return grain-only pH (DI water assumption)
    if (!recipe.waterChemistry) return grainPh;

    const { sourceProfile, saltAdditions } = recipe.waterChemistry;

    // Calculate the mash water profile (source + mash-portion salt additions)
    const mashProfile = this.getMashWaterProfile(
      sourceProfile,
      saltAdditions,
      mashWaterL,
      recipe,
    );

    // Calculate RA from the mash water
    const ra = calculateResidualAlkalinity(mashProfile);

    // Mash thickness factor
    const totalGrainKg = recipe.fermentables.reduce(
      (sum, f) => sum + f.weightKg,
      0,
    );
    const thickness = totalGrainKg > 0 ? mashWaterL / totalGrainKg : STANDARD_THICKNESS_L_PER_KG;
    const thicknessFactor = thickness / STANDARD_THICKNESS_L_PER_KG;

    // Apply RA adjustment
    const phShift = ra * RA_PH_COEFFICIENT * thicknessFactor;
    return grainPh + phShift;
  }

  /**
   * Calculate the grain-only mash pH (distilled water assumption).
   * Uses weight-weighted average of each grain's DI pH.
   */
  calculateGrainOnlyPh(fermentables: Fermentable[]): number | null {
    // Filter to mashable grains only
    const mashGrains = fermentables.filter((f) => this.isMashable(f));
    if (mashGrains.length === 0) return null;

    const totalWeight = mashGrains.reduce((sum, f) => sum + f.weightKg, 0);
    if (totalWeight <= 0) return null;

    const weightedPh = mashGrains.reduce((sum, f) => {
      const category = classifyGrainForPh(f.name, f.colorLovibond);
      const diPh = getGrainDiPh(category, f.colorLovibond);
      return sum + f.weightKg * diPh;
    }, 0);

    return weightedPh / totalWeight;
  }

  /**
   * Calculate the acid or base addition needed to reach the target mash pH.
   *
   * Uses Kolbach's factor for lactic acid (0.66 g of 88% lactic per kg grain
   * per 0.1 pH reduction). For baking soda, uses the RA framework.
   *
   * @param currentPh Current estimated mash pH
   * @param targetPh Target mash pH (default: 5.4)
   * @param totalGrainKg Total weight of mashable grains in kg
   * @param mashWaterL Mash water volume in liters
   * @returns Adjustment recommendation, or null if pH is already in range
   */
  calculatePhAdjustment(
    currentPh: number,
    targetPh: number,
    totalGrainKg: number,
    mashWaterL: number,
  ): MashPhAdjustment | null {
    const delta = currentPh - targetPh;

    // If already at target (within 0.02 tolerance), no adjustment needed
    if (Math.abs(delta) < 0.02) return null;

    if (delta > 0) {
      // pH too high → need acid to lower it
      // Kolbach: 0.66 g of 88% lactic per kg grain per 0.1 pH drop
      const reductionUnits = delta / 0.1;
      const lacticGrams = reductionUnits * LACTIC_88_G_PER_KG_PER_01_PH * totalGrainKg;
      const lacticMl = lacticGrams / LACTIC_88_DENSITY_G_PER_ML;

      return {
        targetPh,
        lacticAcid88Ml: Math.round(lacticMl * 10) / 10, // round to 0.1 mL
        bakingSodaG: 0,
      };
    } else {
      // pH too low → need baking soda to raise it
      // Each g of NaHCO3 per L of mash water adds ~726 ppm HCO3
      // which translates to ~595 ppm RA (as CaCO3) → raises pH by ~1.79 per g/L
      // Scaled by mash thickness.
      const raiseNeeded = Math.abs(delta);
      const thickness = totalGrainKg > 0 ? mashWaterL / totalGrainKg : STANDARD_THICKNESS_L_PER_KG;
      const thicknessFactor = thickness / STANDARD_THICKNESS_L_PER_KG;

      // From the RA coefficient: pH_shift = RA * 0.003 * thicknessFactor
      // We need: raiseNeeded = (grams / mashWaterL * 726.3 * 50/61.016) * 0.003 * thicknessFactor
      // Solving for grams:
      const hco3PpmPerGPerL = 726.3; // ppm HCO3 per g/L of NaHCO3
      const alkalinityFactor = 50 / 61.016; // HCO3 ppm → alkalinity as CaCO3
      const raPerGPerL = hco3PpmPerGPerL * alkalinityFactor;
      const phPerGPerL = raPerGPerL * RA_PH_COEFFICIENT * thicknessFactor;

      const gramsPerL = raiseNeeded / phPerGPerL;
      const totalGrams = gramsPerL * mashWaterL;

      return {
        targetPh,
        lacticAcid88Ml: 0,
        bakingSodaG: Math.round(totalGrams * 10) / 10, // round to 0.1 g
      };
    }
  }

  /**
   * Determine if a fermentable participates in the mash.
   * Extracts and sugars are excluded since they're not present during mashing.
   */
  private isMashable(f: Fermentable): boolean {
    const n = f.name.toLowerCase();
    // Heuristic: exclude extracts and sugars
    if (
      n.includes('extract') ||
      n.includes('dme') ||
      n.includes('lme') ||
      n.includes('dry malt') ||
      n.includes('liquid malt') ||
      n.includes('cane sugar') ||
      n.includes('corn sugar') ||
      n.includes('dextrose') ||
      n.includes('sucrose') ||
      n.includes('table sugar') ||
      n.includes('honey') ||
      n.includes('maple syrup') ||
      n.includes('molasses') ||
      n.includes('brown sugar') ||
      n.includes('candy sugar') ||
      n.includes('candi sugar') ||
      n.includes('invert sugar') ||
      n.includes('lactose') ||
      n.includes('maltodextrin')
    ) {
      return false;
    }
    return true;
  }

  /**
   * Get the mash water ion profile after salt additions.
   * Uses proportional salt splitting between mash and sparge.
   */
  private getMashWaterProfile(
    sourceProfile: WaterProfile,
    saltAdditions: SaltAdditions,
    mashWaterL: number,
    recipe: Recipe,
  ): WaterProfile {
    // We need sparge water to split salts proportionally
    // Use a simple estimate: total water - mash water
    const totalGrainKg = recipe.fermentables.reduce(
      (sum, f) => sum + f.weightKg,
      0,
    );
    const grainAbsorption = totalGrainKg * recipe.equipment.grainAbsorptionLPerKg;
    const mashRunoff = Math.max(0, mashWaterL - grainAbsorption);

    // Pre-boil volume estimate for sparge calculation
    const boilOff = (recipe.equipment.boilTimeMin / 60) * recipe.equipment.boilOffRateLPerHour;
    const preBoilL = recipe.batchVolumeL + boilOff + recipe.equipment.kettleLossLiters;
    const spargeWaterL = Math.max(0, preBoilL - mashRunoff);

    const { mashSalts } = waterChemistryService.splitSaltsProportionally(
      saltAdditions,
      mashWaterL,
      spargeWaterL,
    );

    // Calculate ion contribution from mash salts at mash water volume
    const saltDelta = waterChemistryService.ionDeltaFromSalts(mashSalts, mashWaterL);
    return waterChemistryService.clampProfile(
      waterChemistryService.addProfiles(sourceProfile, saltDelta),
    );
  }
}

// Export singleton instance
export const mashPhCalculationService = new MashPhCalculationService();
