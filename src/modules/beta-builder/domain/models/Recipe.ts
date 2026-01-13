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
  /** Time in minutes (for boil) */
  timeMinutes?: number;
  /** Temperature in Celsius (for whirlpool) */
  temperatureC?: number;
  /** Whirlpool/hopstand time in minutes (separate from boil time) */
  whirlpoolTimeMinutes?: number;
  /** Dry hop start day (day of fermentation to add, e.g., 0 = pitch day, 7 = 1 week in) */
  dryHopStartDay?: number;
  /** Dry hop duration in days */
  dryHopDays?: number;
};

export type YeastType = "liquid-100" | "liquid-200" | "dry" | "slurry";

export type StarterStep = {
  id: string;
  /** Starter volume in liters */
  liters: number;
  /** Starter gravity (e.g., 1.036) */
  gravity: number;
  /** Growth model */
  model: { kind: "white"; aeration: "none" | "shaking" } | { kind: "braukaiser" };
};

export type StarterInfo = {
  /** Package type */
  yeastType: YeastType;
  /** Number of packages/packs */
  packs: number;
  /** Manufacturing date (for viability calculation) */
  mfgDate?: string;
  /** Slurry volume in liters (for slurry type) */
  slurryLiters?: number;
  /** Slurry density in billion cells per mL (for slurry type) */
  slurryBillionPerMl?: number;
  /** Starter steps (up to 3) */
  steps: StarterStep[];
};

export type Yeast = {
  id: string;
  name: string;
  /** Attenuation percentage (e.g., 0.75 for 75% attenuation) */
  attenuation: number;
  /** Laboratory/manufacturer (e.g., "Wyeast", "White Labs") */
  laboratory?: string;
  /** Starter information (optional) */
  starter?: StarterInfo;
};

/**
 * Mash step types
 */
export type MashStepType = 'infusion' | 'temperature' | 'decoction';

/**
 * A single step in the mash schedule
 */
export type MashStep = {
  id: string;
  /** Step name (e.g., "Protein Rest", "Saccharification") */
  name: string;
  /** Step type */
  type: MashStepType;
  /** Target temperature in Celsius */
  temperatureC: number;
  /** Step duration in minutes */
  durationMinutes: number;
  /** Infusion water volume in liters (for infusion steps) */
  infusionVolumeLiters?: number;
  /** Infusion water temperature in Celsius (for infusion steps) */
  infusionTempC?: number;
  /** Decoction volume in liters (for decoction steps) */
  decoctionVolumeLiters?: number;
};

export type Recipe = {
  id: RecipeId;
  name: string;

  /** Recipe metadata */
  style?: string; // BJCP style name (e.g., "American IPA")
  notes?: string; // Brew notes, tasting notes, etc.
  tags?: string[]; // User-defined tags (e.g., ["hoppy", "sessionable", "summer"])

  /** Target batch volume in liters (into fermenter) */
  batchVolumeL: number;

  /** Equipment settings */
  equipment: {
    /** Boil time in minutes */
    boilTimeMin: number;
    /** Boil-off rate in liters per hour */
    boilOffRateLPerHour: number;
    /** Mash efficiency percentage */
    mashEfficiencyPercent: number;
    /** Mash thickness in liters per kilogram (typical: 3.0) */
    mashThicknessLPerKg: number;
    /** Grain absorption in liters per kilogram (typical: 1.04) */
    grainAbsorptionLPerKg: number;
    /** Mash tun deadspace in liters (typical: 2.0) */
    mashTunDeadspaceLiters: number;
    /** Kettle/trub loss in liters (typical: 1.0) */
    kettleLossLiters: number;
    /** Hop absorption in liters per kilogram (typical: 0.7) - NO LONGER OPTIONAL! */
    hopsAbsorptionLPerKg: number;
    /** Chiller loss in liters (typical: 0.5) */
    chillerLossLiters: number;
    /** Fermenter loss in liters (typical: 0.5) */
    fermenterLossLiters: number;
    /** Cooling shrinkage percentage (typical: 4.0) */
    coolingShrinkagePercent: number;
  };

  /** Ingredients */
  fermentables: Fermentable[];
  hops: Hop[];
  yeast: Yeast | null;

  /** Mash schedule (optional - for all-grain recipes) */
  mashSteps: MashStep[];

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
  /** Pre-boil volume in liters */
  preBoilVolumeL: number;
  /** Mash water volume in liters */
  mashWaterL: number;
  /** Sparge water volume in liters */
  spargeWaterL: number;
  /** Total water needed in liters */
  totalWaterL: number;
};
