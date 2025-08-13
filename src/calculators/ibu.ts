// Tinseth IBU calculation utilities

export type HopAddition = {
  weightGrams: number // grams
  alphaAcidPercent: number // e.g. 10 means 10%
  boilTimeMinutes: number
}

export function tinsethGravityFactor(wortGravity: number): number {
  // Tinseth gravity correction factor
  return 1.65 * Math.pow(0.000125, wortGravity - 1.0)
}

export function tinsethTimeFactor(minutes: number): number {
  // Tinseth time utilization factor
  return (1 - Math.exp(-0.04 * minutes)) / 4.15
}

export function tinsethUtilization(minutes: number, wortGravity: number): number {
  return tinsethGravityFactor(wortGravity) * tinsethTimeFactor(minutes)
}

export function ibuSingleAddition(
  addition: HopAddition,
  postBoilVolumeLiters: number,
  wortGravity: number,
): number {
  const utilization = tinsethUtilization(addition.boilTimeMinutes, wortGravity)
  const mgPerL = (addition.weightGrams * (addition.alphaAcidPercent / 100) * 1000 * utilization) / postBoilVolumeLiters
  return mgPerL // 1 IBU = 1 mg iso-alpha per liter
}

export function ibuTotal(
  additions: HopAddition[],
  postBoilVolumeLiters: number,
  wortGravity: number,
): number {
  return additions.reduce((sum, add) => sum + ibuSingleAddition(add, postBoilVolumeLiters, wortGravity), 0)
}


