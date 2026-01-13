/**
 * Volume Display Component
 *
 * Shows calculated water volumes for brew day:
 * - Pre-boil volume
 * - Mash water (strike water)
 * - Sparge water
 * - Total water needed
 */

import type { RecipeCalculations } from "../../domain/models/Recipe";

type Props = {
  calculations: RecipeCalculations | null;
};

export default function VolumeDisplay({ calculations }: Props) {
  if (!calculations) {
    return null;
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 border-t-4 border-cyan-500">
      <h2 className="text-xl font-semibold mb-4">Water Volumes</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Mash Water */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1 font-medium">Mash Water</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {calculations.mashWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Strike water</div>
        </div>

        {/* Sparge Water */}
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-300 mb-1 font-medium">Sparge Water</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {calculations.spargeWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">For sparging</div>
        </div>

        {/* Pre-Boil Volume */}
        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <div className="text-sm text-amber-700 dark:text-amber-300 mb-1 font-medium">Pre-Boil</div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            {calculations.preBoilVolumeL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">In kettle</div>
        </div>

        {/* Total Water */}
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-purple-700 dark:text-purple-300 mb-1 font-medium">Total Water</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {calculations.totalWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Grand total</div>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-4 text-xs bg-[rgb(var(--bg))] p-3 rounded border border-[rgb(var(--border))]">
        <strong>Note:</strong> These volumes account for grain absorption, boil-off,
        hop absorption, deadspace, and all equipment losses.
      </div>
    </div>
  );
}
