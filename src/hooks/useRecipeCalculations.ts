import { useMemo } from "react";
import {
  abvSimple,
  mcuFromGrainBill,
  ogFromPoints,
  pointsFromGrainBill,
  srmMoreyFromMcu,
  srmToHex,
  totalGrainWeightKg,
  computePreBoilVolumeL,
  computeMashWaterL,
  computeSpargeWaterL,
  computeSpargeFromMashUsedL,
  type WaterParams,
} from "../utils/calculations";
import { ibuTotal } from "../calculators/ibu";
import { estimateRecipeHopFlavor } from "../utils/hopsFlavor";
import type {
  GrainItem,
  HopItem,
  YeastItem,
  FermentationStep,
} from "../modules/recipe/types";

export function useRecipeCalculations(params: {
  grains: GrainItem[];
  batchVolumeL: number;
  efficiencyPct: number; // percent (0-100)
  hops: HopItem[];
  yeast: YeastItem;
  mashSteps: {
    id: string;
    type: "infusion" | "decoction" | "ramp";
    tempC: number;
    timeMin: number;
    decoctionPercent?: number;
  }[];
  fermentationSteps: FermentationStep[];
  waterParams: WaterParams;
  brewMethod: "three-vessel" | "biab-full" | "biab-sparge";
  ogAuto: boolean;
  actualOg?: number;
  fgAuto: boolean;
  actualFg?: number;
}) {
  const {
    grains,
    batchVolumeL,
    efficiencyPct,
    hops,
    yeast,
    mashSteps,
    fermentationSteps,
    waterParams,
    brewMethod,
    ogAuto,
    actualOg,
    fgAuto,
    actualFg,
  } = params;

  const totalGrainKg = useMemo(() => totalGrainWeightKg(grains), [grains]);

  // Color (SRM)
  const srm = useMemo(
    () => srmMoreyFromMcu(mcuFromGrainBill(grains, batchVolumeL)),
    [grains, batchVolumeL]
  );
  const color = useMemo(() => srmToHex(srm), [srm]);

  // Auto OG calculation
  const ogAutoCalc = useMemo(
    () =>
      ogFromPoints(
        pointsFromGrainBill(
          grains.map((g) => ({
            weightKg: g.weightKg,
            potentialGu: g.potentialGu,
            type: g.type,
          })),
          batchVolumeL,
          efficiencyPct / 100
        )
      ),
    [grains, batchVolumeL, efficiencyPct]
  );
  const ogUsed = useMemo(
    () => (ogAuto ? ogAutoCalc : actualOg ?? ogAutoCalc),
    [ogAuto, actualOg, ogAutoCalc]
  );

  // Fermentation aggregate params
  const fermentDays = useMemo(
    () =>
      fermentationSteps.reduce((acc, s) => acc + Math.max(0, s.days || 0), 0) ||
      14,
    [fermentationSteps]
  );
  const fermentTempC = useMemo(() => {
    const totalDays = fermentationSteps.reduce(
      (acc, s) => acc + Math.max(0, s.days || 0),
      0
    );
    if (totalDays <= 0) return 20;
    const weighted = fermentationSteps.reduce(
      (acc, s) => acc + Math.max(0, s.days || 0) * (s.tempC ?? 20),
      0
    );
    return weighted / totalDays;
  }, [fermentationSteps]);

  // FG estimation based on yeast attenuation, temp and time
  const fgEstimated = useMemo(() => {
    const baseAtt = yeast.attenuationPercent ?? 0.75; // decimal
    let stepTimeTotal = 0;
    let tempAdjAcc = 0;
    let decoAdjAcc = 0;
    for (const s of mashSteps) {
      const t = Math.max(0, s.timeMin || 0);
      stepTimeTotal += t;
      tempAdjAcc += (66 - (s.tempC || 66)) * 0.006 * t;
      if (s.type === "decoction") decoAdjAcc += 0.005 * t;
    }
    const avgTempAdj = stepTimeTotal > 0 ? tempAdjAcc / stepTimeTotal : 0;
    const avgDecoAdj = stepTimeTotal > 0 ? decoAdjAcc / stepTimeTotal : 0;
    const totalMashTime = stepTimeTotal > 0 ? stepTimeTotal : 60;
    const mashTimeAdj = Math.max(
      -0.03,
      Math.min(0.03, ((totalMashTime - 60) / 15) * 0.005)
    );

    let effAtt =
      baseAtt +
      avgTempAdj +
      avgDecoAdj +
      mashTimeAdj +
      (fermentTempC - 20) * 0.004 +
      (fermentDays - 10) * 0.002;
    effAtt = Math.max(0.6, Math.min(0.95, effAtt));
    return 1 + (ogUsed - 1) * (1 - effAtt);
  }, [yeast.attenuationPercent, fermentTempC, fermentDays, ogUsed, mashSteps]);
  const fgUsed = useMemo(
    () => (fgAuto ? fgEstimated : actualFg ?? fgEstimated),
    [fgAuto, actualFg, fgEstimated]
  );
  const abv = useMemo(() => abvSimple(ogUsed, fgUsed), [ogUsed, fgUsed]);

  const ibu = useMemo(
    () =>
      ibuTotal(
        hops.map((h) => ({
          weightGrams: h.grams,
          alphaAcidPercent: h.alphaAcidPercent,
          boilTimeMinutes: h.timeMin,
          type: h.type,
          whirlpoolTimeMinutes: h.whirlpoolTimeMin,
          whirlpoolTempC: h.whirlpoolTempC,
        })),
        batchVolumeL,
        ogUsed
      ),
    [hops, batchVolumeL, ogUsed]
  );

  // Water calculations
  // Dynamic hop-based kettle loss: add hop absorption to kettleLossL
  const totalKettleHopKg = useMemo(() => {
    const inKettle = new Set(["boil", "first wort", "whirlpool"]);
    return hops
      .filter((h) => inKettle.has(h.type))
      .reduce((sum, h) => sum + Math.max(0, h.grams || 0) / 1000, 0);
  }, [hops]);
  const waterParamsAdjusted = useMemo(() => {
    const hopCoeff = waterParams.hopsAbsorptionLPerKg ?? 0.7;
    const baseKettle = Math.max(0, waterParams.kettleLossL ?? 0);
    const dynamicKettle = baseKettle + Math.max(0, hopCoeff) * totalKettleHopKg;
    return { ...waterParams, kettleLossL: dynamicKettle } as typeof waterParams;
  }, [waterParams, totalKettleHopKg]);

  const preBoilVolumeL = useMemo(
    () => computePreBoilVolumeL(batchVolumeL, waterParamsAdjusted),
    [batchVolumeL, waterParamsAdjusted]
  );
  const mashWaterL = useMemo(
    () => computeMashWaterL(totalGrainKg, waterParamsAdjusted),
    [totalGrainKg, waterParamsAdjusted]
  );
  const spargeWaterL = useMemo(
    () => computeSpargeWaterL(totalGrainKg, batchVolumeL, waterParamsAdjusted),
    [totalGrainKg, batchVolumeL, waterParamsAdjusted]
  );

  const { finalMashL, finalSpargeL, capacityExceeded } = useMemo(() => {
    const absorptionL =
      Math.max(0, waterParams.grainAbsorptionLPerKg) * totalGrainKg;
    const deadspaceL = Math.max(0, waterParams.mashTunDeadspaceL);
    const desiredMashFullVolumeL = preBoilVolumeL + absorptionL + deadspaceL;
    const capacity = waterParams.mashTunCapacityL;

    if (brewMethod === "biab-full") {
      let usedMash = desiredMashFullVolumeL;
      let usedSparge = 0;
      if (capacity && usedMash > capacity) {
        usedMash = capacity;
        usedSparge = computeSpargeFromMashUsedL(
          totalGrainKg,
          batchVolumeL,
          waterParamsAdjusted,
          usedMash
        );
        return {
          finalMashL: usedMash,
          finalSpargeL: usedSparge,
          capacityExceeded: true,
        };
      }
      return {
        finalMashL: usedMash,
        finalSpargeL: usedSparge,
        capacityExceeded: false,
      };
    }

    if (capacity && mashWaterL > capacity) {
      const usedMash = capacity;
      const usedSparge = computeSpargeFromMashUsedL(
        totalGrainKg,
        batchVolumeL,
        waterParamsAdjusted,
        usedMash
      );
      return {
        finalMashL: usedMash,
        finalSpargeL: usedSparge,
        capacityExceeded: true,
      };
    }
    return {
      finalMashL: mashWaterL,
      finalSpargeL: spargeWaterL,
      capacityExceeded: false,
    };
  }, [
    brewMethod,
    waterParamsAdjusted,
    totalGrainKg,
    preBoilVolumeL,
    mashWaterL,
    spargeWaterL,
    batchVolumeL,
    waterParams.grainAbsorptionLPerKg,
    waterParams.mashTunCapacityL,
    waterParams.mashTunDeadspaceL,
  ]);

  // Hops flavor + flags
  const estimatedTotalFlavor = useMemo(
    () => estimateRecipeHopFlavor(hops, batchVolumeL),
    [hops, batchVolumeL]
  );
  const hasSecondTiming = useMemo(
    () => hops.some((x) => x.type === "dry hop" || x.type === "whirlpool"),
    [hops]
  );
  const hasDryHopAdditions = useMemo(
    () => hops.some((x) => x.type === "dry hop"),
    [hops]
  );
  const hasDecoctionStep = useMemo(
    () => mashSteps.some((s) => s.type === "decoction"),
    [mashSteps]
  );

  return {
    // color
    srm,
    color,
    // gravities
    ogAutoCalc,
    ogUsed,
    fgEstimated,
    fgUsed,
    abv,
    // ibu
    ibu,
    // water
    totalGrainKg,
    preBoilVolumeL,
    mashWaterL,
    spargeWaterL,
    finalMashL,
    finalSpargeL,
    capacityExceeded,
    // fermentation derived
    fermentDays,
    fermentTempC,
    // hops flavor
    estimatedTotalFlavor,
    hasSecondTiming,
    hasDryHopAdditions,
    hasDecoctionStep,
  } as const;
}
