/**
 * RecipeCalculationService
 *
 * This is your "Manager" from SwiftUI.
 * Contains all business logic for recipe calculations.
 * NO React dependencies, NO hooks, NO localStorage - pure logic only.
 */

import type { Recipe, RecipeCalculations, Hop, Fermentable } from '../models/Recipe';
import { volumeCalculationService } from './VolumeCalculationService';
import { mashPhCalculationService, DEFAULT_TARGET_PH } from './MashPhCalculationService';
import { inferFermentability } from '../../data/fermentablePresets';

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

    // Nutrition (per 355 ml / 12 oz serving)
    const { calories, carbsG } = this.calculateNutrition(og, fg);

    // Mash pH prediction
    const estimatedMashPh = mashPhCalculationService.calculateMashPh(recipe, mashWaterL);

    // Mash pH adjustment recommendation
    const totalGrainKg = recipe.fermentables.reduce((sum, f) => sum + f.weightKg, 0);
    const mashPhAdjustment = estimatedMashPh != null
      ? mashPhCalculationService.calculatePhAdjustment(
          estimatedMashPh,
          DEFAULT_TARGET_PH,
          totalGrainKg,
          mashWaterL,
        )
      : null;

    return {
      og,
      fg,
      abv,
      ibu,
      srm,
      calories,
      carbsG,
      preBoilVolumeL,
      mashWaterL,
      spargeWaterL,
      totalWaterL,
      estimatedMashPh,
      mashPhAdjustment,
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
   *
   * Two-layer model:
   *  1. Per-ingredient fermentability — splits each fermentable's gravity points
   *     into a fermentable share and a non-fermentable share (e.g. lactose = 0%).
   *  2. Effective attenuation — yeast base attenuation adjusted for mash temp,
   *     decoction, mash duration, fermentation temp, and fermentation duration.
   *     Applied only to the fermentable share.
   *
   * FG = 1 + (nonFermentablePts + fermentablePts × (1 − effAtt)) / 1000
   */
  calculateFG(og: number, recipe: Recipe): number {
    const { fermentables, batchVolumeL, equipment } = recipe;

    // --- 1. Split gravity points by fermentability ---
    const batchVolumeGal = batchVolumeL * 0.264172;
    const efficiency = equipment.mashEfficiencyPercent / 100;

    let fermentablePts = 0;
    let nonFermentablePts = 0;

    if (fermentables.length > 0 && batchVolumeGal > 0) {
      for (const f of fermentables) {
        const weightLbs = f.weightKg * 2.20462;
        const pts = (f.ppg * weightLbs * efficiency) / batchVolumeGal;
        const ferm = this.getFermentability(f);
        fermentablePts += pts * ferm;
        nonFermentablePts += pts * (1 - ferm);
      }
    }

    const totalPts = fermentablePts + nonFermentablePts;
    // Guard: if no gravity points, nothing to attenuate
    if (totalPts <= 0) return 1.0;

    // --- 2. Effective attenuation (yeast + process adjustments) ---
    const effAtt = this.computeEffectiveAttenuation(recipe);

    return 1 + (nonFermentablePts + fermentablePts * (1 - effAtt)) / 1000;
  }

  /**
   * Get the fermentability (0-1) for a recipe fermentable.
   * Uses the explicit value if set, otherwise infers from name/category.
   */
  private getFermentability(f: Fermentable): number {
    if (f.fermentability != null) return f.fermentability;
    return inferFermentability(f);
  }

  /**
   * Compute effective attenuation from yeast base + process adjustments.
   *
   * Factors: mash temperature (ref 66 °C), decoction bonus, mash duration
   * (ref 60 min), fermentation temperature (ref 20 °C), fermentation duration
   * (ref 10 days). Result clamped to [0.60, 0.95].
   */
  private computeEffectiveAttenuation(recipe: Recipe): number {
    const baseAtt = recipe.yeasts?.length > 0
      ? recipe.yeasts[0].attenuation
      : 0.75;

    // Mash adjustments
    let stepTimeTotal = 0;
    let tempAdjAcc = 0;
    let decoAdjAcc = 0;
    for (const step of recipe.mashSteps) {
      const t = Math.max(0, step.durationMinutes || 0);
      stepTimeTotal += t;
      tempAdjAcc += (66 - (step.temperatureC || 66)) * 0.006 * t;
      if (step.type === 'decoction') decoAdjAcc += 0.005 * t;
    }
    const avgTempAdj = stepTimeTotal > 0 ? tempAdjAcc / stepTimeTotal : 0;
    const avgDecoAdj = stepTimeTotal > 0 ? decoAdjAcc / stepTimeTotal : 0;
    const totalMashTime = stepTimeTotal > 0 ? stepTimeTotal : 60;
    const mashTimeAdj = Math.max(-0.03, Math.min(0.03, ((totalMashTime - 60) / 15) * 0.005));

    // Fermentation adjustments
    const { fermentTempC, fermentDays } = this.computeFermentMetrics(recipe);
    const fermTempAdj = (fermentTempC - 20) * 0.004;
    const fermDaysAdj = (fermentDays - 10) * 0.002;

    return Math.max(0.6, Math.min(0.95,
      baseAtt + avgTempAdj + avgDecoAdj + mashTimeAdj + fermTempAdj + fermDaysAdj,
    ));
  }

  /**
   * Derive weighted-average fermentation temperature and total ferment days
   * from primary/secondary fermentation steps. Ignores cold-crash, conditioning,
   * and diacetyl-rest steps since those don't contribute to attenuation.
   */
  private computeFermentMetrics(recipe: Recipe): { fermentTempC: number; fermentDays: number } {
    const attenuativeTypes = new Set(['primary', 'secondary']);
    const steps = recipe.fermentationSteps.filter(s => attenuativeTypes.has(s.type));

    const totalDays = steps.reduce((sum, s) => sum + Math.max(0, s.durationDays || 0), 0);
    if (totalDays <= 0) return { fermentTempC: 20, fermentDays: 10 };

    const weightedTemp = steps.reduce(
      (sum, s) => sum + Math.max(0, s.durationDays || 0) * (s.temperatureC ?? 20), 0,
    );

    return {
      fermentTempC: weightedTemp / totalDays,
      fermentDays: totalDays,
    };
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
      const ibu = this.calculateSingleHopIBU(hop, og, batchVolumeGal);
      return sum + ibu;
    }, 0);

    return Math.round(totalIBU * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculate IBU contribution from a single hop addition
   */
  calculateSingleHopIBU(hop: Hop, og: number, batchVolumeGal: number): number {
    const { alphaAcid, grams, type, timeMinutes = 0, temperatureC = 80, whirlpoolTimeMinutes } = hop;

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
        // Use whirlpoolTimeMinutes if available, fallback to timeMinutes for backward compatibility
        const wpTime = whirlpoolTimeMinutes ?? timeMinutes ?? 15;
        utilization = this.whirlpoolUtilization(wpTime, temperatureC, og);
        break;
      case 'dry hop':
        utilization = 0.05; // 5% contribution from dry hopping
        break;
      case 'mash':
        utilization = 0.02; // 2% contribution from mash hopping
        break;
    }

    // Tinseth formula using imperial units
    // Convert grams to ounces, then calculate AAU
    const oz = grams / 28.3495;
    const aau = oz * alphaAcid;  // Alpha Acid Units
    const ibu = (aau * utilization * 75) / batchVolumeGal;

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
   * Calculate calories and carbohydrates per 355 ml (12 oz) serving.
   *
   * Uses the standard brewing formulas:
   *   OE (Original Extract, °P)  = SG-to-Plato conversion of OG
   *   AE (Apparent Extract, °P)  = SG-to-Plato conversion of FG
   *   RE (Real Extract, °P)      = 0.1808 × OE + 0.8192 × AE
   *   ABW (Alcohol by Weight %)  = (OE - RE) / (2.0665 - 0.010665 × OE)
   *   Calories per litre          = (6.9 × ABW + 4.0 × (RE - 0.1)) × FG × 10
   *   Carbs (g/L)                = (RE − 0.1) × FG × 10  (residual extract as carbs)
   *
   * Reference: "Brew By The Numbers" – Hall, Zymurgy 1995
   */
  calculateNutrition(og: number, fg: number): { calories: number; carbsG: number } {
    // SG → °Plato (simplified polynomial, accurate to ±0.02 °P for beer range)
    const sgToPlato = (sg: number) =>
      -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg;

    const oe = sgToPlato(og); // Original Extract in °Plato
    const ae = sgToPlato(fg); // Apparent Extract in °Plato

    // Real Extract (Balling formula)
    const re = 0.1808 * oe + 0.8192 * ae;

    // Alcohol by Weight
    const abw = (oe - re) / (2.0665 - 0.010665 * oe);

    // Calories per litre of beer
    const calPerL = (6.9 * abw + 4.0 * (re - 0.1)) * fg * 10;

    // Carbohydrates per litre (residual extract approximated as carbs)
    const carbsPerL = (re - 0.1) * fg * 10;

    // Scale to 355 ml (12 oz) serving
    const servingL = 0.355;

    return {
      calories: Math.max(0, Math.round(calPerL * servingL)),
      carbsG: Math.max(0, Math.round(carbsPerL * servingL * 10) / 10),
    };
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
