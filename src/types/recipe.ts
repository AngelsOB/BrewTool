// Centralized recipe and brewing domain types (metric-first)
// Note: Reuse existing WaterProfile/SavedWaterProfile from utils/water to avoid duplication
import type { WaterProfile, SavedWaterProfile } from "../utils/water";

// Core Types - Standardized on metric units internally
export type Recipe = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: number;

  // Style and targeting
  bjcpStyleCode?: string;
  targetProfile: {
    batchVolumeL: number;
    originalGravity: number;
    finalGravity: number;
    abv?: number;
    ibu?: number;
    srm?: number;
  };

  // Equipment reference with snapshot
  equipment: {
    profileId: string;
    snapshotAt: string;
    snapshot: EquipmentProfile;
  };

  // Process settings
  processSettings: {
    mashEfficiencyPct: number;
    ibuCalculationMethod: "tinseth" | "rager" | "garetz";
    colorCalculationMethod: "morey" | "mosher" | "daniels";
    hopUtilizationFactor: number; // default 1.0
    brewMethod: "three-vessel" | "biab-full" | "biab-sparge" | "extract";
  };

  // Ingredients - standardized units
  ingredients: {
    fermentables: FermentableAddition[];
    hops: HopAddition[];
    yeast: YeastAddition | null;
    water?: WaterTreatment;
    other: OtherAddition[];
  };

  // Process steps
  process: {
    mash?: MashProfile;
    fermentation: FermentationSchedule;
    packaging?: PackagingSettings;
  };

  // User preferences
  preferences: {
    displayUnits: "metric" | "us" | "imperial";
    preferredIbuMethod: "tinseth" | "rager" | "garetz";
    preferredColorMethod: "morey" | "daniels" | "mosher";
    sugarScale: "sg" | "plato" | "brix";
  };

  // Brew session tracking
  brewSessions: Array<{
    id: string;
    brewDate: string;
    actualOg?: number;
    actualFg?: number;
    actualAbv?: number;
    actualVolume?: number;
    notes?: string;
    status: "planned" | "brewing" | "fermenting" | "conditioning" | "complete";
  }>;

  // Multiple calculation results
  calculated: {
    originalGravity: number;
    finalGravity: number;
    abv: number;
    ibuTinseth: number;
    ibuRager: number;
    ibuGaretz: number;
    srmMorey: number;
    srmDaniels: number;
    srmMosher: number;
    preboilVolumeL: number;
    postboilVolumeL: number;
    mashWaterL: number;
    spargeWaterL: number;
    totalWaterL: number;
    calories: number;
    realExtract: number;
    apparentAttenuation: number;
    lastCalculated: string;
  };
};

// Ingredient additions with proper normalization
export type FermentableAddition = {
  id: string;
  ingredientRef: {
    type: "preset" | "custom";
    id: string;
  };
  amountKg: number;
  usage: {
    timing: "mash" | "first-wort" | "boil" | "whirlpool" | "fermentation";
    timeMin?: number;
  };
  overrides?: {
    colorLovibond?: number;
    potentialGu?: number;
    fermentability?: number; // 0-1
  };
};

export type HopAddition = {
  id: string;
  ingredientRef: {
    type: "preset" | "custom";
    id: string;
  };
  amountG: number;
  usage: {
    timing: "first-wort" | "boil" | "whirlpool" | "dry-hop" | "mash";
    timeMin: number;
    temperature?: number;
    stage?: "primary" | "secondary" | "keg";
    // Optional dry-hop scheduling semantics. When provided and timing == "dry-hop",
    // these fields indicate when to add hops and for how long (in days),
    // relative to fermentation start.
    // Note: timeMin should still encode total contact time (durationDays * 1440)
    // for backward compatibility with calculators/UI that expect minutes.
    dayOffsetFromFermentationStart?: number; // e.g., 8 means add on day 8
    durationDays?: number; // e.g., 3 means remove/transfer after 3 days
  };
  overrides?: {
    alphaAcidPct?: number;
    betaAcidPct?: number;
  };
};

export type YeastAddition = {
  ingredientRef: {
    type: "preset" | "custom";
    id: string;
  };
  form: "liquid" | "dry" | "slurry";
  quantity: {
    packages?: number;
    gramsOrMl?: number;
  };
  starter?: YeastStarter;
  overrides?: {
    attenuationPct?: number;
    temperature?: {
      minC: number;
      maxC: number;
    };
  };
};

export type YeastStarter = {
  steps: StarterStep[];
  totalVolumeL: number;
  totalDmeG: number;
  estimatedViableCells: number; // billions
};

export type StarterStep = {
  id: string;
  volumeL: number;
  gravityPoints: number; // 1.040 => 40
  timeHours: number;
  temperature: number;
  agitation: "none" | "shaking" | "stir-plate";
};

// Water treatment as separate concern
export type WaterTreatment = {
  // May be a preset key (e.g., "RO", "Montreal"), a saved profile id ("saved:uuid"),
  // a style target ("style:Belgian Ale"), or "Custom".
  sourceProfileId?: string;
  targetProfileId?: string;
  // When custom or resolved at time of save, persist raw profiles for fidelity
  sourceProfile?: WaterProfile;
  targetProfile?: WaterProfile;
  // Optional custom display names when profiles are user-defined
  sourceProfileCustomName?: string;
  targetProfileCustomName?: string;
  salts: {
    gypsumG: number;
    calciumChlorideG: number;
    epsomSaltG: number;
    tableSaltG: number;
    bakingSodaG: number;
  };
  acids: {
    lacticAcidMl?: number;
    phosphoricAcidMl?: number;
    targetMashPh?: number;
  };
  resultingProfile?: WaterProfile;
};

export type OtherAddition = {
  id: string;
  ingredientRef: {
    type: "preset" | "custom";
    id: string;
  };
  amount: number;
  unit: string;
  timing: "mash" | "boil" | "whirlpool" | "primary" | "secondary" | "packaging";
  timeMin?: number;
  notes?: string;
};

// Process definitions
export type MashProfile = {
  method: "single-infusion" | "step-mash" | "decoction";
  steps: MashStep[];
  grainAbsorptionLPerKg: number;
  mashTunDeadSpaceL: number;
};

export type MashStep = {
  id: string;
  name?: string;
  type: "infusion" | "temperature" | "decoction";
  targetTempC: number;
  timeMin: number;
  infusionVolumeL?: number;
  decoctionVolumeL?: number;
};

export type FermentationSchedule = {
  steps: FermentationStep[];
  estimatedDays: number;
};

export type FermentationStep = {
  id: string;
  name: string;
  stage: "primary" | "secondary" | "conditioning" | "cold-crash" | "packaging";
  temperatureC: number;
  durationDays: number;
  pressureKpa?: number;
  notes?: string;
};

export type PackagingSettings = {
  method: "bottle" | "keg" | "cask";
  carbonation: {
    co2Volumes: number;
    method: "priming-sugar" | "forced" | "natural";
    primingSugarG?: number;
    sugarType?: string;
  };
  servingTempC?: number;
};

// Equipment Profile (enhanced with BrewersFriend details)
export type EquipmentProfile = {
  id: string;
  name: string;
  type: "extract" | "all-grain" | "biab";
  volumes: {
    batchVolumeL: number;
    boilVolumeL: number;
    fermenterVolumeL: number;
    mashTunVolumeL?: number;
    kettleDeadspaceL: number;
    lauterDeadspaceL?: number;
  };
  efficiency: {
    mashEfficiencyPct: number;
    brewHouseEfficiencyPct: number;
  };
  losses: {
    evaporationRateLPerHour: number;
    kettleDeadspaceL: number;
    grainAbsorptionLPerKg: number;
    hopsAbsorptionLPerKg: number;
    coolingShrinkagePct: number;
    miscLossL: number;
    fermenterLossL: number;
  };
  thermal: {
    mashTunTempLossPerHour: number;
    grainTempC?: number;
    mashThicknessLPerKg: number;
  };
  timing: {
    boilTimeMin: number;
    mashTimeMin: number;
  };
  calibration: {
    hydrometerOffsetPoints?: number;
    wortCorrectionFactor: number;
    hopUtilizationFactor: number;
  };
  equipment: {
    chillMethod?: "immersion" | "counterflow" | "plate" | "no-chill";
    brand?: string;
    notes?: string;
  };
};

// Ingredient Database Entries
export type FermentableIngredient = {
  id: string;
  name: string;
  category: "grain" | "extract" | "sugar" | "adjunct";
  potentialGu: number;
  colorLovibond: number;
  fermentability: number; // 0-1
  supplier?: string;
  origin?: string;
  description?: string;
  substitutes?: string[];
  maxPercentage?: number;
  mustMash: boolean;
  createdAt: string;
  isCustom: boolean;
};

export type HopIngredient = {
  id: string;
  name: string;
  alphaAcidPct: number;
  betaAcidPct?: number;
  cohumulonePct?: number;
  category: "bittering" | "aroma" | "dual-purpose";
  origin: string;
  flavorProfile?: {
    citrus: number;
    floral: number;
    fruity: number;
    herbal: number;
    piney: number;
    spicy: number;
    earthy: number;
  };
  substitutes?: string[];
  description?: string;
  createdAt: string;
  isCustom: boolean;
};

export type YeastIngredient = {
  id: string;
  name: string;
  laboratory: string;
  productCode?: string;
  type: "ale" | "lager" | "wild" | "bacteria";
  form: "liquid" | "dry";
  attenuationPct: number;
  temperatureRange: {
    minC: number;
    maxC: number;
    optimalC: number;
  };
  alcoholTolerance: number;
  flocculation: "low" | "medium" | "high" | "very-high";
  description?: string;
  styles?: string[];
  createdAt: string;
  isCustom: boolean;
};

// Storage interface - separating concerns
export interface BrewingDataStore {
  recipes: {
    list(): Recipe[];
    get(id: string): Recipe | null;
    save(recipe: Recipe): void;
    delete(id: string): void;
  };
  equipment: {
    list(): EquipmentProfile[];
    get(id: string): EquipmentProfile | null;
    save(profile: EquipmentProfile): void;
    delete(id: string): void;
  };
  ingredients: {
    fermentables: {
      list(): FermentableIngredient[];
      get(id: string): FermentableIngredient | null;
      save(ingredient: FermentableIngredient): void;
    };
    hops: {
      list(): HopIngredient[];
      get(id: string): HopIngredient | null;
      save(ingredient: HopIngredient): void;
    };
    yeasts: {
      list(): YeastIngredient[];
      get(id: string): YeastIngredient | null;
      save(ingredient: YeastIngredient): void;
    };
  };
  water: {
    profiles: {
      list(): SavedWaterProfile[];
      save(profile: SavedWaterProfile): void;
      delete(id: string): void;
    };
  };
}

// Export formats for interoperability
export interface BeerXMLExporter {
  exportRecipe(recipe: Recipe): string; // BeerXML 2.0 format
  importRecipe(xml: string): Recipe;
}

export interface JSONExporter {
  exportRecipe(recipe: Recipe): string; // Custom JSON format
  importRecipe(json: string): Recipe;
}
