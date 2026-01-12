/**
 * Domain Models for Beta Builder
 *
 * These are pure TypeScript types with no logic.
 * They represent the core data structures of the application.
 */

export type RecipeId = string;

export type Fermentable = {
  id: string;
  name: string;
  /** Weight in kilograms */
  weightKg: number;
  /** Color in Lovibond */
  colorLovibond: number;
  /** Potential gravity points per pound per gallon (e.g., 36 for 2-row malt) */
  ppg: number;
  /** Extract efficiency as percentage (e.g., 80 means 80% efficiency) */
  efficiencyPercent: number;
};

export type Hop = {
  id: string;
  name: string;
  /** Alpha acid percentage (e.g., 12.5 for 12.5% AA) */
  alphaAcid: number;
  /** Weight in grams */
  grams: number;
  /** Hop addition type */
  type: 'boil' | 'whirlpool' | 'dry hop' | 'first wort' | 'mash';
  /** Time in minutes (for boil/whirlpool) */
  timeMinutes?: number;
  /** Temperature in Celsius (for whirlpool) */
  temperatureC?: number;
};

export type Recipe = {
  id: RecipeId;
  name: string;

  /** Target batch volume in liters (into fermenter) */
  batchVolumeL: number;

  /** Equipment settings - simplified for now */
  equipment: {
    /** Boil time in minutes */
    boilTimeMin: number;
    /** Boil-off rate in liters per hour */
    boilOffRateLPerHour: number;
    /** Mash efficiency percentage */
    mashEfficiencyPercent: number;
  };

  /** Ingredients */
  fermentables: Fermentable[];
  hops: Hop[];

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
};

/**
 * Calculated values for a recipe.
 * These are NOT stored in the Recipe object - they are computed on-demand.
 */
export type RecipeCalculations = {
  /** Original Gravity (e.g., 1.050) */
  og: number;
  /** Final Gravity (e.g., 1.010) - estimated for now */
  fg: number;
  /** Alcohol by Volume percentage (e.g., 5.2) */
  abv: number;
  /** International Bitterness Units */
  ibu: number;
  /** Standard Reference Method color */
  srm: number;
};
