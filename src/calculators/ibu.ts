// Tinseth IBU calculation utilities

export type HopTimingType =
  | "boil"
  | "dry hop"
  | "whirlpool"
  | "first wort"
  | "mash";

export type HopAddition = {
  weightGrams: number; // grams
  alphaAcidPercent: number; // e.g. 10 means 10%
  boilTimeMinutes: number; // only relevant for 'boil' type
  type: HopTimingType;
  // Whirlpool-specific (optional)
  whirlpoolTimeMinutes?: number;
  whirlpoolTempC?: number; // typical 65–99°C
};

export function tinsethGravityFactor(wortGravity: number): number {
  // Tinseth gravity correction factor
  return 1.65 * Math.pow(0.000125, wortGravity - 1.0);
}

export function tinsethTimeFactor(minutes: number): number {
  // Tinseth time utilization factor
  return (1 - Math.exp(-0.04 * minutes)) / 4.15;
}

export function tinsethUtilization(
  minutes: number,
  wortGravity: number
): number {
  return tinsethGravityFactor(wortGravity) * tinsethTimeFactor(minutes);
}

// Simplified whirlpool utilization model:
// - Scale Tinseth time factor by a temperature coefficient in [0,1]
// - 60°C -> ~0, 80°C -> ~0.5, 100°C -> 1.0
// This is a pragmatic approximation for hop stand isomerization.
export function whirlpoolUtilization(
  minutes: number,
  tempC: number,
  wortGravity: number
): number {
  const clampedTemp = Math.max(60, Math.min(100, tempC));
  // Exponential temperature factor: 0 at 60°C, 1 at 100°C
  const tempFactor = tempC <= 60 ? 0 : Math.pow((clampedTemp - 60) / 40, 1.8);
  return (
    tinsethGravityFactor(wortGravity) * tinsethTimeFactor(minutes) * tempFactor
  );
}

export function ibuSingleAddition(
  addition: HopAddition,
  postBoilVolumeLiters: number,
  wortGravity: number
): number {
  let utilization = 0;
  switch (addition.type) {
    case "boil":
      utilization = tinsethUtilization(addition.boilTimeMinutes, wortGravity);
      break;
    case "first wort":
      // ~10% boost for FWH due to pH and pre-boil contact time
      utilization =
        tinsethUtilization(addition.boilTimeMinutes, wortGravity) * 1.1;
      break;
    case "whirlpool":
      {
        const wpMin = addition.whirlpoolTimeMinutes ?? 0;
        const wpTemp = addition.whirlpoolTempC ?? 80;
        utilization = whirlpoolUtilization(wpMin, wpTemp, wortGravity);
      }
      break;
    case "dry hop": {
      // Dry hops contribute ~2-8% of their potential IBU through non-isomerized compounds
      // Higher for aged hops (more oxidation products), longer contact time, higher temps
      const dryHopFactor = 0.05; // Conservative 5% contribution
      utilization = tinsethUtilization(60, wortGravity) * dryHopFactor;
      break;
    }
    case "mash":
      // Minimal contribution from carryover into the boil
      utilization = tinsethUtilization(60, wortGravity) * 0.15;
      break;
    default:
      utilization = 0;
  }

  const mgPerL =
    (addition.weightGrams *
      (addition.alphaAcidPercent / 100) *
      1000 *
      utilization) /
    postBoilVolumeLiters;
  return mgPerL; // 1 IBU = 1 mg iso-alpha per liter
}

export function ibuTotal(
  additions: HopAddition[],
  postBoilVolumeLiters: number,
  wortGravity: number
): number {
  return additions.reduce(
    (sum, add) =>
      sum + ibuSingleAddition(add, postBoilVolumeLiters, wortGravity),
    0
  );
}
