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

export function ibuSingleAddition(
  addition: HopAddition,
  postBoilVolumeLiters: number,
  wortGravity: number
): number {
  let utilization = 0;
  switch (addition.type) {
    case "boil":
    case "first wort": // For simplicity, treating first wort as boil for IBU for now.
      utilization = tinsethUtilization(addition.boilTimeMinutes, wortGravity);
      break;
    case "whirlpool":
      // Whirlpool additions contribute some IBU, but it's complex. For simplicity,
      // we'll assign a fixed, small utilization, or assume it's negligible for now.
      // A common simplification is to treat it as a short boil, e.g., 10-15 min.
      // Let's use a fixed small value, or 0 if we want to be conservative about calculated IBU.
      // For now, let's treat it as a 10 min boil for IBU calculation.
      utilization = tinsethUtilization(10, wortGravity); // Simplified assumption
      break;
    case "dry hop":
    case "mash":
      // Dry hops and mash hops contribute negligible to no IBU in typical calculations
      utilization = 0;
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
