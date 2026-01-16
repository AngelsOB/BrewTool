/**
 * Brew Session Domain Models
 *
 * A BrewSession represents an actual brew day where a recipe is executed.
 * It tracks:
 * - The original recipe (what was planned)
 * - The brew day recipe (what was actually used - may have modifications)
 * - Actual measurements taken during brewing
 * - Calculated efficiency metrics
 */

import type { Recipe } from './Recipe';

export type SessionId = string;

export type SessionStatus =
  | 'planning'      // Session created but not started
  | 'brewing'       // Currently brewing
  | 'fermenting'    // In fermentation
  | 'conditioning'  // Conditioning/carbonating
  | 'completed';    // Finished

/**
 * Actual measurements taken during brew day
 */
export type SessionActuals = {
  // Volume measurements (liters)
  strikeWaterL?: number;
  spargeWaterL?: number;
  preBoilVolumeL?: number;
  postBoilVolumeL?: number;
  intoFermenterL?: number;
  packagedVolumeL?: number;

  // Temperature measurements (°C)
  strikeWaterTempC?: number;
  mashTempC?: number;

  // Gravity measurements (specific gravity, e.g., 1.050)
  preBoilGravity?: number;
  originalGravity?: number;
  finalGravity?: number;

  // Chemistry measurements
  mashPH?: number;
  finalPH?: number;

  // Time tracking
  boilTimeMin?: number;
  fermentationDays?: number;
};

/**
 * Calculated metrics from actuals
 */
export type SessionCalculated = {
  /** Actual ABV calculated from measured OG/FG */
  actualABV?: number;

  /** Mash efficiency % (from pre-boil gravity vs expected) */
  mashEfficiency?: number;

  /** Brewhouse efficiency % (from OG vs expected) */
  brewhouseEfficiency?: number;

  /** Apparent attenuation % (from OG/FG) */
  apparentAttenuation?: number;
};

/**
 * A complete brew session
 */
export type BrewSession = {
  /** Unique session ID */
  id: SessionId;

  /** Link to original recipe */
  recipeId: string;
  recipeVersionNumber: number;
  recipeName: string; // Snapshot for display even if recipe deleted
  brewedVersionNumber?: number;

  /** Original recipe (what was planned - read-only reference) */
  originalRecipe: Recipe;

  /** Brew day recipe (what was actually used - can be modified) */
  brewDayRecipe: Recipe;

  /** Actual measurements taken during brew day */
  actuals: SessionActuals;

  /** Auto-calculated metrics */
  calculated?: SessionCalculated;

  /** Brew day metadata */
  brewDate: string; // ISO timestamp
  status: SessionStatus;

  /** Free-form notes about the brew day */
  notes?: string;

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
};
