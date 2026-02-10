/**
 * pH Adjustments Section Component
 *
 * Displays the estimated mash pH with status indicators and
 * action buttons to add pH adjustment ingredients (lactic acid or baking soda).
 */

import type { RecipeCalculations } from "../../../domain/models/Recipe";

type Props = {
  /** Recipe calculations containing mash pH data */
  calculations: RecipeCalculations;
  /** Whether water chemistry has been configured */
  hasWaterChemistry: boolean;
  /** Callback when user adds a pH adjustment ingredient */
  onAddPhAdjustment: (name: string, amount: number, unit: string) => void;
};

export default function PhAdjustmentsSection({
  calculations,
  hasWaterChemistry,
  onAddPhAdjustment,
}: Props) {
  const ph = calculations.estimatedMashPh;
  if (ph == null) return null;

  const adj = calculations.mashPhAdjustment;
  const inRange = ph >= 5.2 && ph <= 5.6;
  const inIdeal = ph >= 5.2 && ph <= 5.4;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
        Estimated Mash pH
      </h3>
      <div
        className={`rounded-lg p-4 border ${
          inIdeal
            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
            : inRange
              ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`text-3xl font-bold ${
                inIdeal
                  ? "text-green-900 dark:text-green-100"
                  : inRange
                    ? "text-yellow-900 dark:text-yellow-100"
                    : "text-red-900 dark:text-red-100"
              }`}
            >
              {ph.toFixed(2)}
            </div>
            <div
              className={`text-xs mt-1 ${
                inIdeal
                  ? "text-green-600 dark:text-green-400"
                  : inRange
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {hasWaterChemistry ? "With water profile" : "DI water estimate"} &middot;
              Target: 5.2–5.6
            </div>
          </div>
          {adj && adj.lacticAcid88Ml > 0 && (
            <button
              onClick={() =>
                onAddPhAdjustment("Lactic acid (88%)", adj.lacticAcid88Ml, "ml")
              }
              className="text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-md text-right hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors cursor-pointer border border-amber-300 dark:border-amber-700"
            >
              <div className="font-semibold">
                + Add ~{adj.lacticAcid88Ml} mL lactic acid (88%)
              </div>
              <div className="text-amber-600 dark:text-amber-400">
                to reach pH {adj.targetPh.toFixed(1)}
              </div>
            </button>
          )}
          {adj && adj.bakingSodaG > 0 && (
            <button
              onClick={() => onAddPhAdjustment("Baking soda", adj.bakingSodaG, "g")}
              className="text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-md text-right hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors cursor-pointer border border-amber-300 dark:border-amber-700"
            >
              <div className="font-semibold">
                + Add ~{adj.bakingSodaG} g baking soda
              </div>
              <div className="text-amber-600 dark:text-amber-400">
                to reach pH {adj.targetPh.toFixed(1)}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
