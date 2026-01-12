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
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Water Volumes</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Mash Water */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-700 mb-1 font-medium">Mash Water</div>
          <div className="text-2xl font-bold text-blue-900">
            {calculations.mashWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">Strike water</div>
        </div>

        {/* Sparge Water */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-700 mb-1 font-medium">Sparge Water</div>
          <div className="text-2xl font-bold text-green-900">
            {calculations.spargeWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-green-600 mt-1">For sparging</div>
        </div>

        {/* Pre-Boil Volume */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-sm text-amber-700 mb-1 font-medium">Pre-Boil</div>
          <div className="text-2xl font-bold text-amber-900">
            {calculations.preBoilVolumeL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-amber-600 mt-1">In kettle</div>
        </div>

        {/* Total Water */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-700 mb-1 font-medium">Total Water</div>
          <div className="text-2xl font-bold text-purple-900">
            {calculations.totalWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-purple-600 mt-1">Grand total</div>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
        <strong>Note:</strong> These volumes account for grain absorption, boil-off,
        hop absorption, deadspace, and all equipment losses.
      </div>
    </div>
  );
}
