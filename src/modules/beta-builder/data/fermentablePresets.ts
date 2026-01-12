/**
 * Fermentable preset database
 *
 * This file imports the generated grain database from the old builder
 * and provides it in a format suitable for the Beta Builder.
 *
 * Source: src/utils/presets.generated.grains.json
 */

import type { FermentablePreset } from "../domain/models/Presets";

// Import the generated grain database
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON import handled by bundler
import GENERATED_GRAINS_JSON from "../../../utils/presets.generated.grains.json";

// Type-cast the imported JSON to our FermentablePreset type
export const FERMENTABLE_PRESETS: FermentablePreset[] =
  GENERATED_GRAINS_JSON as FermentablePreset[];

/**
 * Group names for organizing fermentables by type
 */
export type FermentableGroup =
  | "Base malts"
  | "Crystal/Caramel"
  | "Roasted"
  | "Toasted & specialty"
  | "Adjuncts (mashable/flaked)"
  | "Extracts"
  | "Sugars"
  | "Lauter aids & other";

/**
 * Categorizes a fermentable preset into a group
 */
export function categorizeFermentable(preset: FermentablePreset): FermentableGroup {
  const nameLower = preset.name.toLowerCase();

  // Extracts
  if (preset.type === "extract") {
    return "Extracts";
  }

  // Sugars
  if (preset.type === "sugar") {
    return "Sugars";
  }

  // Lauter aids
  if (nameLower.includes("rice hull")) {
    return "Lauter aids & other";
  }

  // Adjuncts (mashable/flaked)
  if (
    preset.type === "adjunct_mashable" ||
    nameLower.includes("flaked") ||
    nameLower.includes("torrified")
  ) {
    return "Adjuncts (mashable/flaked)";
  }

  // Roasted malts
  if (
    nameLower.includes("roasted") ||
    nameLower.includes("black") ||
    nameLower.includes("chocolate") ||
    nameLower.includes("carafa") ||
    (preset.colorLovibond >= 300 && !nameLower.includes("caramel"))
  ) {
    return "Roasted";
  }

  // Crystal/Caramel malts
  if (
    nameLower.includes("crystal") ||
    nameLower.includes("caramel") ||
    nameLower.includes("cara") ||
    (preset.colorLovibond >= 10 &&
      preset.colorLovibond < 200 &&
      !nameLower.includes("munich") &&
      !nameLower.includes("aromatic") &&
      !nameLower.includes("biscuit"))
  ) {
    return "Crystal/Caramel";
  }

  // Toasted & specialty
  if (
    nameLower.includes("aromatic") ||
    nameLower.includes("biscuit") ||
    nameLower.includes("victory") ||
    nameLower.includes("amber") ||
    nameLower.includes("brown") ||
    nameLower.includes("melanoidin") ||
    nameLower.includes("special") ||
    (preset.colorLovibond >= 20 && preset.colorLovibond < 100)
  ) {
    return "Toasted & specialty";
  }

  // Default to base malts
  return "Base malts";
}

/**
 * Groups fermentables by category
 */
export function groupFermentables(
  presets: FermentablePreset[]
): Array<{ label: FermentableGroup; items: FermentablePreset[] }> {
  const groups: Record<FermentableGroup, FermentablePreset[]> = {
    "Base malts": [],
    "Crystal/Caramel": [],
    Roasted: [],
    "Toasted & specialty": [],
    "Adjuncts (mashable/flaked)": [],
    Extracts: [],
    Sugars: [],
    "Lauter aids & other": [],
  };

  for (const preset of presets) {
    const group = categorizeFermentable(preset);
    groups[group].push(preset);
  }

  // Return only non-empty groups in order
  const groupOrder: FermentableGroup[] = [
    "Base malts",
    "Crystal/Caramel",
    "Roasted",
    "Toasted & specialty",
    "Adjuncts (mashable/flaked)",
    "Extracts",
    "Sugars",
    "Lauter aids & other",
  ];

  return groupOrder
    .filter((label) => groups[label].length > 0)
    .map((label) => ({
      label,
      items: groups[label],
    }));
}
