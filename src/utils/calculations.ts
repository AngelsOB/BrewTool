// Centralized brewing formulas for reuse across builder components
// Keep pure and unit-annotated

export function ogFromPoints(points: number): number {
  return 1 + points / 1000;
}

export function pointsFromGrainBill(
  grains: Array<{ weightKg: number; colorLovibond: number; yield: number }>,
  batchVolumeL: number
): number {
  const ppgPerLovibond = 37; // Standard PPG (points per pound per gallon) for 1 LoviBond grain
  const gravityPoints = grains.reduce(
    (sum, grain) =>
      sum + grain.weightKg * grain.yield * ppgPerLovibond * grain.colorLovibond,
    0
  );
  const galPerL = 0.264172; // Conversion from liters to gallons
  return gravityPoints / (batchVolumeL * galPerL);
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
  // Approximate SRM to RGB mapping based on empirical curve
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  const r = clamp(255 * Math.exp(-0.1 * srm), 0, 255);
  const g = clamp(255 * Math.exp(-0.07 * srm), 0, 255);
  const b = clamp(255 * Math.exp(-0.02 * srm), 0, 255);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
