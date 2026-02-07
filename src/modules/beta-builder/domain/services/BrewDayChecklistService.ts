/**
 * BrewDayChecklistService
 *
 * Generates smart default brew day checklist items based on the recipe.
 * Items are focused on target measurements and important test reminders —
 * not step-by-step instructions. Target values are populated from the
 * recipe's calculations where available.
 */

import type {
  Recipe,
  RecipeCalculations,
  BrewDayChecklistItem,
  BrewDayStage,
} from '../models/Recipe';
import { recipeCalculationService } from './RecipeCalculationService';
import { volumeCalculationService } from './VolumeCalculationService';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n: number | undefined, d = 1): string =>
  n == null || Number.isNaN(n) ? '–' : Number(n).toFixed(d);

const cToF = (c: number): string => fmt((c * 9) / 5 + 32, 0);

const lToGal = (l: number): string => fmt(l * 0.264172, 2);

/* ------------------------------------------------------------------ */
/*  Smart default generation                                           */
/* ------------------------------------------------------------------ */

/**
 * Build default checklist items for a recipe.
 * Each item shows the target value the brewer should be hitting,
 * or flags an important test / sample moment.
 */
export function generateDefaultChecklist(
  recipe: Recipe,
  calculations?: RecipeCalculations | null,
): BrewDayChecklistItem[] {
  const calc = calculations ?? recipeCalculationService.calculate(recipe);
  const items: BrewDayChecklistItem[] = [];
  let seq = 0;
  const id = () => `default-${++seq}`;

  // Pre-boil gravity (derived)
  const preBoilGravity =
    calc.preBoilVolumeL > 0
      ? 1 + ((calc.og - 1) * recipe.batchVolumeL) / calc.preBoilVolumeL
      : calc.og;

  // Strike temperature
  const firstMashTemp = recipe.mashSteps[0]?.temperatureC;
  const strikeTemp =
    firstMashTemp != null
      ? volumeCalculationService.calculateStrikeTemp(
          firstMashTemp,
          recipe.equipment.mashThicknessLPerKg,
        )
      : undefined;

  // First fermentation step temperature (pitch temp target)
  const pitchTemp = recipe.fermentationSteps[0]?.temperatureC;

  // ── Mash ────────────────────────────────────────────────────────
  const phDetail = calc.estimatedMashPh != null
    ? `Predicted: ${fmt(calc.estimatedMashPh, 2)} — Target: 5.2–5.6`
    : 'Target: 5.2–5.6';

  items.push({
    id: id(),
    label: 'Mash pH',
    stage: 'mash',
    details: phDetail,
    enabled: true,
  });

  if (strikeTemp != null) {
    items.push({
      id: id(),
      label: 'Strike temperature',
      stage: 'mash',
      details: `Target: ${fmt(strikeTemp)}°C (${cToF(strikeTemp)}°F)`,
      enabled: true,
    });
  }

  // ── Pre-Boil ────────────────────────────────────────────────────
  items.push({
    id: id(),
    label: 'Pre-boil gravity',
    stage: 'pre-boil',
    details: `Target: ${fmt(preBoilGravity, 3)}`,
    enabled: true,
  });

  items.push({
    id: id(),
    label: 'Pre-boil volume',
    stage: 'pre-boil',
    details: `Target: ${fmt(calc.preBoilVolumeL)} L (${lToGal(calc.preBoilVolumeL)} gal)`,
    enabled: true,
  });

  // ── Post-Boil ───────────────────────────────────────────────────
  items.push({
    id: id(),
    label: 'Original gravity (OG)',
    stage: 'post-boil',
    details: `Target: ${fmt(calc.og, 3)}`,
    enabled: true,
  });

  // ── Pitch ───────────────────────────────────────────────────────
  if (pitchTemp != null) {
    items.push({
      id: id(),
      label: 'Pitch temperature',
      stage: 'pitch',
      details: `Target: ${fmt(pitchTemp)}°C (${cToF(pitchTemp)}°F)`,
      enabled: true,
    });
  }

  items.push({
    id: id(),
    label: 'Collect forced fermentation test (FFT) sample',
    stage: 'pitch',
    details: '~200 mL of wort, pitch excess yeast, keep warm. Compare to fermenter later.',
    enabled: true,
  });

  // ── Fermentation ────────────────────────────────────────────────
  items.push({
    id: id(),
    label: 'Check FFT sample',
    stage: 'fermentation',
    details: `Compare FFT to expected FG: ${fmt(calc.fg, 3)}`,
    enabled: true,
  });

  items.push({
    id: id(),
    label: 'Final gravity (FG) reading',
    stage: 'fermentation',
    details: `Target: ${fmt(calc.fg, 3)} — two stable readings 48 h apart confirms completion.`,
    enabled: true,
  });

  return items;
}

/* ------------------------------------------------------------------ */
/*  Merge: user overrides ⊕ smart defaults                            */
/* ------------------------------------------------------------------ */

/**
 * Merge per-recipe user overrides with smart defaults.
 *
 * Rules:
 *  1. Start with the generated defaults for this recipe.
 *  2. If the user has an override with the same id → use the user's version.
 *  3. Any extra user items (custom id not in defaults) are appended at
 *     the end of their stage group.
 */
export function mergeChecklist(
  recipe: Recipe,
  calculations?: RecipeCalculations | null,
): BrewDayChecklistItem[] {
  const defaults = generateDefaultChecklist(recipe, calculations);
  const userItems = recipe.brewDayChecklist;

  if (!userItems || userItems.length === 0) {
    return defaults;
  }

  const userById = new Map(userItems.map(i => [i.id, i]));

  // Replace defaults with user overrides where they exist
  const merged: BrewDayChecklistItem[] = defaults.map(d =>
    userById.has(d.id) ? userById.get(d.id)! : d
  );

  // Collect custom user items not present in defaults
  const defaultIds = new Set(defaults.map(d => d.id));
  const extras = userItems.filter(u => !defaultIds.has(u.id));

  // Append extras after the last item of their stage, or at the end
  for (const extra of extras) {
    const lastIdx = findLastIndex(merged, i => i.stage === extra.stage);
    if (lastIdx >= 0) {
      merged.splice(lastIdx + 1, 0, extra);
    } else {
      merged.push(extra);
    }
  }

  return merged;
}

/* ------------------------------------------------------------------ */
/*  Stage metadata (for ordering & display)                            */
/* ------------------------------------------------------------------ */

/** Human-readable labels and natural brew-day order for each stage */
export const STAGE_META: Record<BrewDayStage, { label: string; order: number }> = {
  'water-prep':   { label: '🔥 Water Prep',         order: 0 },
  'mash':         { label: '🌾 Mash',               order: 1 },
  'pre-boil':     { label: '📏 Pre-Boil',           order: 2 },
  'boil':         { label: '♨️ Boil',                order: 3 },
  'post-boil':    { label: '🌡️ Post-Boil',          order: 4 },
  'pitch':        { label: '🧫 Pitch',              order: 5 },
  'fermentation': { label: '🫧 Fermentation',       order: 6 },
  'dry-hop':      { label: '🌿 Dry Hop',            order: 7 },
  'cold-crash':   { label: '❄️ Cold Crash',          order: 8 },
  'packaging':    { label: '📦 Packaging',           order: 9 },
};

/**
 * Group checklist items by stage, in natural brew-day order.
 * Only includes stages that have at least one enabled item.
 */
export function groupByStage(
  items: BrewDayChecklistItem[]
): { stage: BrewDayStage; label: string; items: BrewDayChecklistItem[] }[] {
  const groups = new Map<BrewDayStage, BrewDayChecklistItem[]>();

  for (const item of items) {
    if (!item.enabled) continue;
    const list = groups.get(item.stage) ?? [];
    list.push(item);
    groups.set(item.stage, list);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => STAGE_META[a].order - STAGE_META[b].order)
    .map(([stage, items]) => ({
      stage,
      label: STAGE_META[stage].label,
      items,
    }));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}
