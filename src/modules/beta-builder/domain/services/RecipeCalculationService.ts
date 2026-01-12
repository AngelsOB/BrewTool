/**
 * RecipeCalculationService
 *
 * This is your "Manager" from SwiftUI.
 * Contains all business logic for recipe calculations.
 * NO React dependencies, NO hooks, NO localStorage - pure logic only.
 */

import type { Recipe, RecipeCalculations, Fermentable, Hop } from '../models/Recipe';
import { volumeCalculationService } from './VolumeCalculationService';

export class RecipeCalculationService {
  /**
   * Calculate all recipe values
   */
  calculate(recipe: Recipe): RecipeCalculations {
    const og = this.calculateOG(recipe);
    const fg = this.calculateFG(og, recipe);
    const abv = this.calculateABV(og, fg);
    const ibu = this.calculateIBU(recipe, og);
    const srm = this.calculateSRM(recipe);

    // Volume calculations
    const preBoilVolumeL = volumeCalculationService.calculatePreBoilVolume(recipe);
    const mashWaterL = volumeCalculationService.calculateMashWater(recipe);
    const spargeWaterL = volumeCalculationService.calculateSpargeWater(recipe);
    const totalWaterL = volumeCalculationService.calculateTotalWater(recipe);

    return {
      og,
      fg,
      abv,
      ibu,
      srm,
      preBoilVolumeL,
      mashWaterL,
      spargeWaterL,
      totalWaterL,
    };
  }

  /**
   * Calculate Original Gravity
   * Formula: OG = 1 + (total gravity points / batch volume in gallons)
   */
  calculateOG(recipe: Recipe): number {
    const { fermentables, batchVolumeL, equipment } = recipe;

    if (fermentables.length === 0 || batchVolumeL <= 0) {
      return 1.0;
    }

    const batchVolumeGal = batchVolumeL * 0.264172; // liters to gallons
    const efficiency = equipment.mashEfficiencyPercent / 100;

    const totalGravityPoints = fermentables.reduce((sum, fermentable) => {
      const weightLbs = fermentable.weightKg * 2.20462; // kg to lbs
      const points = fermentable.ppg * weightLbs * efficiency;
      return sum + points;
    }, 0);

    const gravityPoints = totalGravityPoints / batchVolumeGal;
    return 1 + gravityPoints / 1000;
  }

  /**
   * Calculate Final Gravity
   * Uses yeast attenuation if available, otherwise defaults to 75%
   */
  calculateFG(og: number, recipe: Recipe): number {
    const attenuation = recipe.yeast?.attenuation || 0.75;
    const gravityPoints = (og - 1) * 1000;
    const attenuatedPoints = gravityPoints * (1 - attenuation);
    return 1 + attenuatedPoints / 1000;
  }

  /**
   * Calculate Alcohol By Volume
   * Formula: ABV = (OG - FG) × 131.25
   */
  calculateABV(og: number, fg: number): number {
    return (og - fg) * 131.25;
  }

  /**
   * Calculate IBU using Tinseth formula
   */
  calculateIBU(recipe: Recipe, og: number): number {
    const { hops, batchVolumeL } = recipe;

    if (hops.length === 0 || batchVolumeL <= 0) {
      return 0;
    }

    const batchVolumeGal = batchVolumeL * 0.264172;

    const totalIBU = hops.reduce((sum, hop) => {
      const ibu = this.calculateHopIBU(hop, og, batchVolumeGal);
      return sum + ibu;
    }, 0);

    return Math.round(totalIBU * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculate IBU contribution from a single hop addition
   */
  private calculateHopIBU(hop: Hop, og: number, batchVolumeGal: number): number {
    const { alphaAcid, grams, type, timeMinutes = 0, temperatureC = 80 } = hop;

    // AA utilization based on addition type
    let utilization = 0;

    switch (type) {
      case 'boil':
        utilization = this.tinsethUtilization(timeMinutes, og);
        break;
      case 'first wort':
        utilization = this.tinsethUtilization(timeMinutes + 20, og); // FWH gets bonus time
        break;
      case 'whirlpool':
        utilization = this.whirlpoolUtilization(timeMinutes, temperatureC, og);
        break;
      case 'dry hop':
        utilization = 0.05; // 5% contribution from dry hopping
        break;
      case 'mash':
        utilization = 0.02; // 2% contribution from mash hopping
        break;
    }

    // Tinseth formula: IBU = (AAU × U × 75) / Vgal
    // Where AAU = grams × AA% / 1000
    const aau = (grams * alphaAcid) / 1000;
    const ibu = (aau * utilization * 74.89) / batchVolumeGal;

    return ibu;
  }

  /**
   * Tinseth utilization formula
   */
  private tinsethUtilization(minutes: number, wortGravity: number): number {
    const gravityFactor = 1.65 * Math.pow(0.000125, wortGravity - 1);
    const timeFactor = (1 - Math.exp(-0.04 * minutes)) / 4.15;
    return gravityFactor * timeFactor;
  }

  /**
   * Whirlpool utilization with temperature adjustment
   */
  private whirlpoolUtilization(
    minutes: number,
    tempC: number,
    wortGravity: number
  ): number {
    const clampedTemp = Math.max(60, Math.min(100, tempC));
    const tempFactor = tempC <= 60 ? 0 : Math.pow((clampedTemp - 60) / 40, 1.8);
    return this.tinsethUtilization(minutes, wortGravity) * tempFactor;
  }

  /**
   * Calculate SRM color using Morey equation
   */
  calculateSRM(recipe: Recipe): number {
    const { fermentables, batchVolumeL } = recipe;

    if (fermentables.length === 0 || batchVolumeL <= 0) {
      return 0;
    }

    const batchVolumeGal = batchVolumeL * 0.264172;

    const totalMCU = fermentables.reduce((sum, fermentable) => {
      const weightLbs = fermentable.weightKg * 2.20462;
      const mcu = (fermentable.colorLovibond * weightLbs) / batchVolumeGal;
      return sum + mcu;
    }, 0);

    // Morey equation: SRM = 1.4922 × MCU^0.6859
    return 1.4922 * Math.pow(totalMCU, 0.6859);
  }
}

// Export singleton instance for convenience
export const recipeCalculationService = new RecipeCalculationService();
