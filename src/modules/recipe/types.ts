// Lightweight UI shapes used by recipe builder components

export type GrainItem = {
  id: string;
  name: string;
  weightKg: number;
  colorLovibond: number;
  potentialGu: number;
  type: "grain" | "adjunct_mashable" | "extract" | "sugar";
  fermentability?: number;
  customNameLocked?: boolean;
  customNameSelected?: boolean;
};

export type HopTimingType = "boil" | "dry hop" | "whirlpool" | "first wort" | "mash";

export type HopItem = {
  id: string;
  name: string;
  grams: number;
  alphaAcidPercent: number;
  timeMin: number;
  category?: string;
  type: HopTimingType;
  flavor?: {
    citrus?: number;
    floral?: number;
    fruity?: number;
    herbal?: number;
    piney?: number;
    spicy?: number;
    earthy?: number;
  };
  customNameLocked?: boolean;
  customNameSelected?: boolean;
  dryHopStage?: "primary" | "post-fermentation" | "keg";
  dryHopDays?: number;
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
  decoctionPercent?: number;
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
  unit: string;
  timing: "mash" | "boil" | "whirlpool" | "secondary" | "kegging" | "bottling";
  notes?: string;
  customNameLocked?: boolean;
  customNameSelected?: boolean;
};


