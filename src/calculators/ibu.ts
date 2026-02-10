// Tinseth IBU calculation utilities
//
// Input validation: All functions guard against invalid inputs (NaN, Infinity,
// negative values, division by zero) and return 0 or a safe default for edge cases.
// This ensures callers don't need to pre-validate every input.

export type HopTimingType =
  | "boil"
  | "dry hop"
  | "whirlpool"
  | "first wort"
  | "mash";

export type HopAddition = {
  weightGrams: number; // grams (expected: >= 0)
  alphaAcidPercent: number; // e.g. 10 means 10% (expected: 0-100)
  boilTimeMinutes: number; // only relevant for 'boil' type (expected: >= 0)
  type: HopTimingType;
  // Whirlpool-specific (optional)
  whirlpoolTimeMinutes?: number; // expected: >= 0
  whirlpoolTempC?: number; // typical 65–99°C
};

/**
 * Check if a number is valid (finite and not NaN)
 */
function isValidNumber(n: number): boolean {
  return Number.isFinite(n);
}

export function tinsethGravityFactor(wortGravity: number): number {
  // Guard: return 0 for invalid gravity (would produce NaN/Infinity)
  if (!isValidNumber(wortGravity)) return 0;
  // Tinseth gravity correction factor
  return 1.65 * Math.pow(0.000125, wortGravity - 1.0);
}

export function tinsethTimeFactor(minutes: number): number {
  // Guard: return 0 for invalid or negative time
  if (!isValidNumber(minutes) || minutes < 0) return 0;
  // Tinseth time utilization factor
  return (1 - Math.exp(-0.04 * minutes)) / 4.15;
}

export function tinsethUtilization(
  minutes: number,
  wortGravity: number
): number {
  // Guards handled by sub-functions; returns 0 if either factor is invalid
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
  // Guard: return 0 for invalid temperature
  if (!isValidNumber(tempC)) return 0;
  const clampedTemp = Math.max(60, Math.min(100, tempC));
  // Exponential temperature factor: 0 at 60°C, 1 at 100°C
  const tempFactor = tempC <= 60 ? 0 : Math.pow((clampedTemp - 60) / 40, 1.8);
  // Minutes and gravity guards handled by sub-functions
  return (
    tinsethGravityFactor(wortGravity) * tinsethTimeFactor(minutes) * tempFactor
  );
}

export function ibuSingleAddition(
  addition: HopAddition,
  postBoilVolumeLiters: number,
  wortGravity: number
): number {
  // Guard: return 0 for invalid volume (prevents division by zero / Infinity)
  if (!isValidNumber(postBoilVolumeLiters) || postBoilVolumeLiters <= 0) {
    return 0;
  }

  // Guard: return 0 for invalid weight or alpha acid
  const weight = addition.weightGrams;
  const alphaAcid = addition.alphaAcidPercent;
  if (!isValidNumber(weight) || weight <= 0) return 0;
  if (!isValidNumber(alphaAcid) || alphaAcid < 0) return 0;

  // Guard: return 0 for invalid gravity (gravity near 1.0 is typical; extreme values are unusual)
  if (!isValidNumber(wortGravity)) return 0;

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
    (weight * (alphaAcid / 100) * 1000 * utilization) / postBoilVolumeLiters;
  return mgPerL; // 1 IBU = 1 mg iso-alpha per liter
}

export function ibuTotal(
  additions: HopAddition[],
  postBoilVolumeLiters: number,
  wortGravity: number
): number {
  // Guard: return 0 for empty additions or invalid parameters
  // Individual addition validation handled by ibuSingleAddition
  if (!additions || additions.length === 0) return 0;

  return additions.reduce(
    (sum, add) =>
      sum + ibuSingleAddition(add, postBoilVolumeLiters, wortGravity),
    0
  );
}
