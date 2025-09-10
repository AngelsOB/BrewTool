// Centralized brewing formulas for reuse across builder components
// Keep pure and unit-annotated

export function ogFromPoints(points: number): number {
  return 1 + points / 1000;
}

export function pointsFromGrainBill(
  grains: Array<{
    weightKg: number;
    potentialGu: number;
    type?: "grain" | "adjunct_mashable" | "extract" | "sugar";
  }>,
  batchVolumeL: number,
  efficiencyDecimal = 0.72
): number {
  // Convert grain bill into gravity points (GU) per gallon
  // Uses PPG derived from yield (46 ppg reference for table sugar), NOT color
  const lbsPerKg = 2.20462;
  const galPerL = 0.264172;
  const volumeGal = batchVolumeL * galPerL;
  if (!Number.isFinite(volumeGal) || volumeGal <= 0) return 0;

  const totalGU = grains.reduce((sum, g) => {
    const weightLb = g.weightKg * lbsPerKg;
    const ppg = g.potentialGu;
    const isMashable =
      g.type === "grain" || g.type === "adjunct_mashable" || g.type == null;
    const eff = isMashable ? efficiencyDecimal : 1;
    return sum + weightLb * ppg * eff;
  }, 0);

  return totalGU / volumeGal;
}

export function abvSimple(og: number, fg: number): number {
  return (og - fg) * 131.25;
}

export function mcuFromGrainBill(
  grains: Array<{ weightKg: number; colorLovibond: number }>,
  volumeL: number
): number {
  const lbsPerKg = 2.20462;
  const galPerL = 0.264172;
  const lbsGal = grains.reduce(
    (sum, g) => sum + g.weightKg * lbsPerKg * g.colorLovibond,
    0
  );
  return lbsGal / (volumeL * galPerL);
}

export function srmMoreyFromMcu(mcu: number): number {
  return 1.4922 * Math.pow(mcu, 0.6859);
}

export function srmToHex(srm: number): string {
  // SRM -> Hex using a well-known SRM palette with linear interpolation.
  // Clamped to [1, 40].
  const stops: Array<{ s: number; hex: string }> = [
    { s: 1, hex: "#F3F993" },
    { s: 2, hex: "#F5F75C" },
    { s: 3, hex: "#F6F513" },
    { s: 4, hex: "#EAE615" },
    { s: 5, hex: "#E0D01B" },
    { s: 6, hex: "#D5BC26" },
    { s: 7, hex: "#CDAA37" },
    { s: 8, hex: "#C1963C" },
    { s: 9, hex: "#BE8C3A" },
    { s: 10, hex: "#BE823A" },
    { s: 12, hex: "#C17A37" },
    { s: 14, hex: "#BF7138" },
    { s: 15, hex: "#BC6733" },
    { s: 17, hex: "#B26033" },
    { s: 18, hex: "#A85839" },
    { s: 20, hex: "#985336" },
    { s: 24, hex: "#8D4C32" },
    { s: 26, hex: "#7C452D" },
    { s: 30, hex: "#6B3A1E" },
    { s: 35, hex: "#5D341A" },
    { s: 40, hex: "#4E2A0C" },
  ];

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  const sr = clamp(srm, 1, 40);

  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return [r, g, b];
  };
  const rgbToHex = (r: number, g: number, b: number): string => {
    const to = (n: number) => Math.round(n).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
  };

  // Find bounding stops
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].s <= sr) lower = stops[i];
    if (stops[i].s >= sr) {
      upper = stops[i];
      break;
    }
  }
  if (lower.s === upper.s) return lower.hex;

  const t = (sr - lower.s) / (upper.s - lower.s);
  const [lr, lg, lb] = hexToRgb(lower.hex);
  const [ur, ug, ub] = hexToRgb(upper.hex);
  const r = lr + (ur - lr) * t;
  const g = lg + (ug - lg) * t;
  const b = lb + (ub - lb) * t;
  return rgbToHex(r, g, b);
}

// OG from grain bill (auto)
export function ppgFromYieldDecimal(yieldDecimal: number): number {
  // 46 ppg is table sugar reference
  return 46 * yieldDecimal;
}

export function ogFromGrainBill(
  grains: Array<{
    weightKg: number;
    potentialGu: number;
    type?: "grain" | "adjunct_mashable" | "extract" | "sugar";
  }>,
  volumeL: number,
  efficiencyDecimal: number
): number {
  const lbsPerKg = 2.20462;
  const galPerL = 0.264172;
  const volumeGal = volumeL * galPerL;
  if (!Number.isFinite(volumeGal) || volumeGal <= 0) return 1.0;

  const totalGU = grains.reduce((sum, g) => {
    const weightLb = g.weightKg * lbsPerKg;
    const ppg = g.potentialGu;
    const isMashable =
      g.type === "grain" || g.type === "adjunct_mashable" || g.type == null;
    const eff = isMashable ? efficiencyDecimal : 1;
    return sum + weightLb * ppg * eff;
  }, 0);

  const points = totalGU / volumeGal; // gravity points per gallon
  return 1 + points / 1000;
}

// ==========================
// Water calculations
// ==========================

export type WaterParams = {
  // Mash thickness expressed in liters of water per kilogram of grain
  mashThicknessLPerKg: number;
  // Typical grain absorption in liters per kilogram (after lautering)
  grainAbsorptionLPerKg: number;
  // Volume that cannot be drained from the mash tun
  mashTunDeadspaceL: number;
  // Optional physical capacity of mash tun (used by UI to warn/adjust)
  mashTunCapacityL?: number;
  // Boil time in minutes
  boilTimeMin: number;
  // Boil-off rate in liters per hour
  boilOffRateLPerHour: number;
  // Simple-mode combined kettle trub loss in liters
  trubLossL?: number;
  // Advanced mode: post-boil shrinkage percent (e.g., 4 means 4%)
  coolingShrinkagePercent?: number;
  // Advanced mode: losses separated
  kettleLossL?: number; // kettle deadspace + trub left in kettle
  chillerLossL?: number; // losses in plate immersion chiller, hoses
  fermenterLossL?: number; // not used for pre-boil if target is into fermenter
  // Optional hop absorption coefficient (liters per kilogram of hops)
  hopsAbsorptionLPerKg?: number;
};

export function totalGrainWeightKg(
  grains: Array<{ weightKg: number }>
): number {
  return grains.reduce((sum, g) => sum + (g.weightKg || 0), 0);
}

export function computePreBoilVolumeL(
  batchVolumeL: number,
  params: Pick<
    WaterParams,
    | "boilTimeMin"
    | "boilOffRateLPerHour"
    | "trubLossL"
    | "coolingShrinkagePercent"
    | "kettleLossL"
    | "chillerLossL"
  >
): number {
  // If advanced fields are provided, redirect to advanced solver for consistency
  if (
    params.coolingShrinkagePercent != null ||
    params.kettleLossL != null ||
    params.chillerLossL != null
  ) {
    return computePreBoilVolumeLAdvanced(batchVolumeL, params).preBoilL;
  }
  const boilHours = Math.max(0, (params.boilTimeMin || 0) / 60);
  const boilOff = Math.max(0, params.boilOffRateLPerHour || 0) * boilHours;
  const trub = Math.max(0, params.trubLossL || 0);
  return Math.max(0, batchVolumeL + boilOff + trub);
}

export function computePreBoilVolumeLAdvanced(
  batchVolumeIntoFermenterL: number,
  params: Pick<
    WaterParams,
    | "boilTimeMin"
    | "boilOffRateLPerHour"
    | "coolingShrinkagePercent"
    | "kettleLossL"
    | "chillerLossL"
  >
): { preBoilL: number; postBoilHotL: number } {
  const boilHours = Math.max(0, (params.boilTimeMin || 0) / 60);
  const boilOff = Math.max(0, params.boilOffRateLPerHour || 0) * boilHours;
  const shrinkPct = Math.max(0, params.coolingShrinkagePercent ?? 4);
  const shrinkFactor = 1 - shrinkPct / 100;
  const kettleLoss = Math.max(0, params.kettleLossL ?? 0);
  const chillerLoss = Math.max(0, params.chillerLossL ?? 0);

  // Solve for hot post-boil kettle volume so that after shrinkage and losses
  // the volume into fermenter equals the batch target.
  // V_hot * shrinkFactor - (kettleLoss + chillerLoss) = batch
  const postBoilHotL =
    (batchVolumeIntoFermenterL + kettleLoss + chillerLoss) /
    Math.max(0.0001, shrinkFactor);
  const preBoilL = postBoilHotL + boilOff;
  return {
    preBoilL: Math.max(0, preBoilL),
    postBoilHotL: Math.max(0, postBoilHotL),
  };
}

export function computeMashWaterL(
  totalGrainKg: number,
  params: Pick<WaterParams, "mashThicknessLPerKg" | "mashTunDeadspaceL">
): number {
  const thickness = Math.max(0, params.mashThicknessLPerKg || 0);
  const deadspace = Math.max(0, params.mashTunDeadspaceL || 0);
  return Math.max(0, totalGrainKg * thickness + deadspace);
}

export function computeSpargeWaterL(
  totalGrainKg: number,
  batchVolumeL: number,
  params: WaterParams
): number {
  // If advanced parameters are present, use advanced pre-boil math that
  // accounts for shrinkage and split losses; otherwise use simple model.
  const hasAdvanced =
    params.coolingShrinkagePercent != null ||
    params.kettleLossL != null ||
    params.chillerLossL != null;
  const preBoil = hasAdvanced
    ? computePreBoilVolumeLAdvanced(batchVolumeL, {
        boilTimeMin: params.boilTimeMin,
        boilOffRateLPerHour: params.boilOffRateLPerHour,
        coolingShrinkagePercent: params.coolingShrinkagePercent,
        kettleLossL: params.kettleLossL,
        chillerLossL: params.chillerLossL,
      }).preBoilL
    : computePreBoilVolumeL(batchVolumeL, params);
  const mashWater = computeMashWaterL(totalGrainKg, params);
  const absorption =
    Math.max(0, params.grainAbsorptionLPerKg || 0) * totalGrainKg;
  const deadspace = Math.max(0, params.mashTunDeadspaceL || 0);
  const mashRunoff = Math.max(0, mashWater - absorption - deadspace);
  const sparge = Math.max(0, preBoil - mashRunoff);
  return sparge;
}

export function computeSpargeFromMashUsedL(
  totalGrainKg: number,
  batchVolumeL: number,
  params: WaterParams,
  mashWaterUsedL: number
): number {
  const preBoil = computePreBoilVolumeL(batchVolumeL, params);
  const absorption =
    Math.max(0, params.grainAbsorptionLPerKg || 0) * totalGrainKg;
  const deadspace = Math.max(0, params.mashTunDeadspaceL || 0);
  const mashRunoff = Math.max(0, mashWaterUsedL - absorption - deadspace);
  return Math.max(0, preBoil - mashRunoff);
}
