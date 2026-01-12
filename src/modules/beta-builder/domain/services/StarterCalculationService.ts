/**
 * Starter Calculation Service
 *
 * Calculates yeast cell counts and starter requirements.
 * Based on White and Braukaiser growth models.
 */

import type { StarterStep, YeastType } from "../models/Recipe";

export type StarterCalculationResult = {
  /** Required cells in billions */
  requiredCellsB: number;
  /** Cells available from package in billions */
  cellsAvailableB: number;
  /** Results for each starter step */
  stepResults: Array<{
    id: string;
    dmeGrams: number;
    endBillion: number;
  }>;
  /** Final cell count after all steps in billions */
  finalEndB: number;
  /** Total starter volume in liters */
  totalStarterL: number;
  /** Total DME required in grams */
  totalDmeG: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export class StarterCalculationService {
  /**
   * Convert specific gravity to degrees Plato
   */
  sgToPlato(sg: number): number {
    const s2 = sg * sg;
    const s3 = s2 * sg;
    return -616.868 + 1111.14 * sg - 630.272 * s2 + 135.997 * s3;
  }

  /**
   * Calculate DME grams needed for target gravity
   */
  dmeGramsForGravity(
    liters: number,
    gravity: number,
    dmePpg = 45
  ): number {
    const points = Math.max(0, (gravity - 1) * 1000);
    const gallons = liters * 0.264172;
    const pounds = (points * gallons) / Math.max(0.0001, dmePpg);
    return pounds * 453.59237; // grams
  }

  /**
   * Calculate yeast viability based on manufacture date
   * @param mfgDate ISO date string
   * @returns Viability factor (0-1)
   */
  calculateViability(mfgDate: string | undefined): number {
    if (!mfgDate) return 1.0;

    const made = new Date(mfgDate).getTime();
    if (Number.isNaN(made)) return 1.0;

    const days = Math.max(
      0,
      Math.floor((Date.now() - made) / (24 * 60 * 60 * 1000))
    );

    // 0.7% loss per day
    return clamp(1 - 0.007 * days, 0, 1);
  }

  /**
   * Calculate cells available from yeast package
   */
  calculateCellsAvailable(
    yeastType: YeastType,
    packs: number,
    mfgDate?: string,
    slurryLiters?: number,
    slurryBillionPerMl?: number
  ): number {
    if (yeastType === "dry") {
      // Treat packs as 11g sachets; default density 6B/g
      const grams = Math.max(0, Math.floor(packs)) * 11;
      const densityBPerG = 6;
      return grams * densityBPerG;
    }

    if (yeastType === "slurry") {
      return Math.max(0, slurryLiters || 0) * 1000 * Math.max(0, slurryBillionPerMl || 0);
    }

    const basePerPack = yeastType === "liquid-200" ? 200 : 100;
    const numPacks = Math.max(0, Math.floor(packs));
    const viability = this.calculateViability(mfgDate);

    return numPacks * basePerPack * viability;
  }

  /**
   * Calculate required cells for a recipe
   * @param volumeL Batch volume in liters
   * @param og Original gravity
   * @param pitchRate Pitch rate (default 0.75 for ale)
   */
  calculateRequiredCells(
    volumeL: number,
    og: number,
    pitchRate: number = 0.75
  ): number {
    const plato = this.sgToPlato(og);
    return pitchRate * Math.max(0, volumeL) * Math.max(0, plato);
  }

  /**
   * White model growth calculation
   */
  private whiteModelGrowth(
    currentBillion: number,
    liters: number,
    aeration: "none" | "shaking"
  ): { growthFactor: number; endBillion: number } {
    const inoculationRateBPerL = currentBillion / Math.max(0.0001, liters);
    const base =
      12.54793776 * Math.pow(inoculationRateBPerL, -0.4594858324) - 0.9994994906;
    const aerationBoost = aeration === "shaking" ? 0.5 : 0;
    const growthFactor = clamp(base + aerationBoost, 0, 6);
    const saturationB = 200 * liters;
    const proposed = currentBillion * (1 + growthFactor);
    const endBillion = Math.min(saturationB, proposed);
    return { growthFactor, endBillion };
  }

  /**
   * Braukaiser model growth calculation
   */
  private braukaiserGrowth(
    currentBillion: number,
    liters: number,
    gravity: number
  ): { growthBillion: number; endBillion: number } {
    const grams = this.dmeGramsForGravity(liters, gravity, 45);
    // Constant B/g as per common Braukaiser usage
    const bPerGram = 1.4;
    const growthBillion = grams * bPerGram;
    // Braukaiser model has no intrinsic upper growth limit
    const endBillion = currentBillion + growthBillion;
    return { growthBillion, endBillion };
  }

  /**
   * Calculate complete starter plan
   */
  calculateStarter(
    volumeL: number,
    og: number,
    yeastType: YeastType,
    packs: number,
    mfgDate: string | undefined,
    slurryLiters: number | undefined,
    slurryBillionPerMl: number | undefined,
    steps: StarterStep[]
  ): StarterCalculationResult {
    const requiredCellsB = this.calculateRequiredCells(volumeL, og);
    const cellsAvailableB = this.calculateCellsAvailable(
      yeastType,
      packs,
      mfgDate,
      slurryLiters,
      slurryBillionPerMl
    );

    const stepResults: Array<{
      id: string;
      dmeGrams: number;
      endBillion: number;
    }> = [];

    let current = Math.max(0, cellsAvailableB);

    for (const step of steps) {
      const dmeG = this.dmeGramsForGravity(step.liters, step.gravity, 45);

      if (step.model.kind === "white") {
        const { endBillion } = this.whiteModelGrowth(
          current,
          step.liters,
          step.model.aeration
        );
        current = endBillion;
        stepResults.push({ id: step.id, dmeGrams: dmeG, endBillion });
      } else {
        const { endBillion } = this.braukaiserGrowth(
          current,
          step.liters,
          step.gravity
        );
        current = endBillion;
        stepResults.push({ id: step.id, dmeGrams: dmeG, endBillion });
      }
    }

    const finalEndB = stepResults.length
      ? stepResults[stepResults.length - 1].endBillion
      : cellsAvailableB;

    const totalStarterL = steps.reduce(
      (sum, s) => sum + (Number(s.liters) || 0),
      0
    );

    const totalDmeG = steps.reduce(
      (sum, s) => sum + this.dmeGramsForGravity(s.liters, s.gravity, 45),
      0
    );

    return {
      requiredCellsB,
      cellsAvailableB,
      stepResults,
      finalEndB,
      totalStarterL,
      totalDmeG,
    };
  }
}

// Export singleton instance
export const starterCalculationService = new StarterCalculationService();
