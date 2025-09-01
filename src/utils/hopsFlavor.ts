import type { HopItem } from "../modules/recipe/types";
import type { HopFlavorProfile } from "./presets";
import { EMPTY_HOP_FLAVOR, HOP_FLAVOR_KEYS } from "./presets";

// Tunable constants
const AROMA_DECAY_PER_MINUTE = 0.05; // exp(-k*t) decay for boil additions
const OVERALL_INTENSITY_LAMBDA = 0.7; // maps g/L to 0-5 via 1-exp(-lambda*x)

function clamp(value: number, min = 0, max = 5): number {
  return Math.max(min, Math.min(max, value));
}

function timingAromaFactor(
  type: HopItem["type"],
  timeMin: number,
  dryHopDays?: number,
  dryHopStartDay?: number,
  whirlpoolTimeMin?: number,
  whirlpoolTempC?: number
): number {
  switch (type) {
    case "dry hop": {
      if (!dryHopDays || dryHopDays <= 0) return 0.6;
      const t = Math.min(7, dryHopDays);
      const base = 0.6 + 0.4 * (1 - Math.exp(-0.6 * t));
      // Start day adjustment (simple model):
      //  - Early (≤2 days): more CO₂ scrubbing → slight penalty
      //  - Mid (3–7 days): neutral (best retention)
      //  - Late (8–14 days): small penalty for staling risk during warm contact
      //  - Very late (≥15 days): larger penalty
      const d =
        typeof dryHopStartDay === "number" ? Math.max(0, dryHopStartDay) : 4;
      const startAdj = d <= 2 ? 0.9 : d <= 7 ? 1.0 : d <= 14 ? 0.95 : 0.9;
      return base * startAdj;
    }
    case "whirlpool": {
      // Model: base 0.75, boosted by cooler temps and longer steeps (but saturates)
      // colder whirlpool (~75-85C) preserves more oils; hotter (~95C) loses more
      const temp = typeof whirlpoolTempC === "number" ? whirlpoolTempC : 80;
      const time = typeof whirlpoolTimeMin === "number" ? whirlpoolTimeMin : 15;
      const tempFactor = 0.6 + 0.4 * Math.max(0, Math.min(1, (95 - temp) / 20)); // 95C->0.6, 75C->1.0
      const timeFactor = 1 - Math.exp(-0.06 * Math.max(0, time)); // saturates ~30 min
      return Math.min(1, 0.5 + 0.5 * tempFactor * timeFactor);
    }
    case "boil":
      return Math.max(
        0.03,
        Math.exp(-AROMA_DECAY_PER_MINUTE * Math.max(0, timeMin))
      );
    case "first wort":
      return 0.08;
    case "mash":
      return 0.05;
    default:
      return 0.5;
  }
}

function normalizeHopFlavor(
  f: NonNullable<HopItem["flavor"]> | undefined
): HopFlavorProfile {
  type FlavorSource = NonNullable<HopItem["flavor"]> & {
    tropicalFruit?: number;
    stoneFruit?: number;
    berry?: number;
    spice?: number;
    resinPine?: number;
    grassy?: number;
  };
  const src: Partial<FlavorSource> = f ?? {};
  return {
    ...EMPTY_HOP_FLAVOR,
    citrus: src.citrus ?? 0,
    floral: src.floral ?? 0,
    tropicalFruit: src.tropicalFruit ?? src.fruity ?? 0,
    stoneFruit: src.stoneFruit ?? 0,
    berry: src.berry ?? 0,
    herbal: src.herbal ?? 0,
    spice: src.spice ?? src.spicy ?? 0,
    resinPine: src.resinPine ?? src.piney ?? 0,
    grassy: src.grassy ?? src.earthy ?? 0,
  };
}

/**
 * Estimate the final hop-driven flavor profile of the recipe, scaled by:
 * - grams per liter (dose)
 * - timing-derived aroma retention factor
 *
 * Algorithm:
 * - Compute per-addition aroma weight w_i = (grams_i / batchL) * aromaFactor(type, time)
 * - Compute axis sums S_axis = sum_i w_i * (flavor_i_axis / 5)
 * - Let W = sum_i w_i (overall aroma intensity proxy)
 * - Map W to magnitude M in [0,5] via M = 5*(1 - exp(-lambda * W))
 * - Final axis = clamp( M * (S_axis / (W || 1)) )
 */
export function estimateRecipeHopFlavor(
  hops: HopItem[],
  batchVolumeL: number
): HopFlavorProfile {
  let overallWeight = 0;
  const axisSum: Record<(typeof HOP_FLAVOR_KEYS)[number], number> = {
    citrus: 0,
    tropicalFruit: 0,
    stoneFruit: 0,
    berry: 0,
    floral: 0,
    grassy: 0,
    herbal: 0,
    spice: 0,
    resinPine: 0,
  };

  for (const h of hops) {
    if (!h || !h.name) continue;
    const gpl = batchVolumeL > 0 ? (h.grams || 0) / batchVolumeL : 0; // grams per liter
    const factor = timingAromaFactor(
      h.type,
      h.timeMin || 0,
      h.dryHopDays,
      h.dryHopStartDay,
      h.whirlpoolTimeMin,
      h.whirlpoolTempC
    );
    const weight = gpl * factor;
    if (weight <= 0) continue;
    const flavor = normalizeHopFlavor(h.flavor);
    overallWeight += weight;
    for (const k of HOP_FLAVOR_KEYS) {
      const axis = (flavor[k] || 0) / 5; // normalize to 0..1
      axisSum[k] += weight * axis;
    }
  }

  if (overallWeight <= 0) return { ...EMPTY_HOP_FLAVOR };

  const magnitude =
    5 * (1 - Math.exp(-OVERALL_INTENSITY_LAMBDA * overallWeight));

  const result: HopFlavorProfile = { ...EMPTY_HOP_FLAVOR };
  for (const k of HOP_FLAVOR_KEYS) {
    const proportion = axisSum[k] / overallWeight; // 0..1
    result[k] = clamp(magnitude * proportion);
  }
  return result;
}

/** Quick helper: estimated per-hop contribution vectors (already scaled). */
export function estimatePerHopContributions(
  hops: HopItem[],
  batchVolumeL: number
): { name: string; flavor: HopFlavorProfile; weight: number }[] {
  const rows: { name: string; flavor: HopFlavorProfile; weight: number }[] = [];
  for (const h of hops) {
    if (!h || !h.name) continue;
    const gpl = batchVolumeL > 0 ? (h.grams || 0) / batchVolumeL : 0;
    const factor = timingAromaFactor(
      h.type,
      h.timeMin || 0,
      h.dryHopDays,
      h.dryHopStartDay,
      h.whirlpoolTimeMin,
      h.whirlpoolTempC
    );
    const weight = gpl * factor;
    const flavor = normalizeHopFlavor(h.flavor);
    const scaled: HopFlavorProfile = { ...EMPTY_HOP_FLAVOR };
    for (const k of HOP_FLAVOR_KEYS) {
      scaled[k] = (flavor[k] || 0) * Math.min(1, weight);
    }
    rows.push({ name: h.name, flavor: scaled, weight });
  }
  return rows;
}
