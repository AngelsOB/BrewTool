// Centralized brewing formulas for reuse across builder components
// Keep pure and unit-annotated

export function ogFromPoints(points: number): number {
  return 1 + points / 1000;
}

export function pointsFromGrainBill(
  grains: Array<{ weightKg: number; yield: number }>,
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
    const ppg = ppgFromYieldDecimal(g.yield);
    return sum + weightLb * ppg * efficiencyDecimal;
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
  // Approximate SRM to RGB mapping based on empirical curve
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  const r = clamp(255 * Math.exp(-0.1 * srm), 0, 255);
  const g = clamp(255 * Math.exp(-0.07 * srm), 0, 255);
  const b = clamp(255 * Math.exp(-0.02 * srm), 0, 255);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// OG from grain bill (auto)
export function ppgFromYieldDecimal(yieldDecimal: number): number {
  // 46 ppg is table sugar reference
  return 46 * yieldDecimal;
}

export function ogFromGrainBill(
  grains: Array<{ weightKg: number; yield: number }>,
  volumeL: number,
  efficiencyDecimal: number
): number {
  const lbsPerKg = 2.20462;
  const galPerL = 0.264172;
  const volumeGal = volumeL * galPerL;
  if (!Number.isFinite(volumeGal) || volumeGal <= 0) return 1.0;

  const totalGU = grains.reduce((sum, g) => {
    const weightLb = g.weightKg * lbsPerKg;
    const ppg = ppgFromYieldDecimal(g.yield);
    return sum + weightLb * ppg * efficiencyDecimal;
  }, 0);

  const points = totalGU / volumeGal; // gravity points per gallon
  return 1 + points / 1000;
}
