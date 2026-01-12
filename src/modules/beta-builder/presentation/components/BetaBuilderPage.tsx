/**
 * Beta Builder Page
 *
 * This is your SwiftUI "View" - pure UI, no business logic.
 * It uses the store (like @ObservedObject) and hooks (for calculations).
 */

import { useEffect } from 'react';
import { useRecipeStore } from '../stores/recipeStore';
import { useRecipeCalculations } from '../hooks/useRecipeCalculations';
import FermentableSection from './FermentableSection';
import HopSection from './HopSection';

export default function BetaBuilderPage() {
  const {
    currentRecipe,
    createNewRecipe,
    updateRecipe,
    saveCurrentRecipe,
  } = useRecipeStore();

  const calculations = useRecipeCalculations(currentRecipe);

  // Create a new recipe on mount if none exists
  useEffect(() => {
    if (!currentRecipe) {
      createNewRecipe();
    }
  }, [currentRecipe, createNewRecipe]);

  // Removed hard-coded fermentable handler - now using FermentableSection with presets

  if (!currentRecipe) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Recipe Builder</h1>
        </div>

        {/* Recipe Name */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipe Name
          </label>
          <input
            type="text"
            value={currentRecipe.name}
            onChange={(e) => updateRecipe({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Equipment Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Equipment</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Volume (L)
              </label>
              <input
                type="number"
                value={currentRecipe.batchVolumeL}
                onChange={(e) =>
                  updateRecipe({ batchVolumeL: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mash Efficiency (%)
              </label>
              <input
                type="number"
                value={currentRecipe.equipment.mashEfficiencyPercent}
                onChange={(e) =>
                  updateRecipe({
                    equipment: {
                      ...currentRecipe.equipment,
                      mashEfficiencyPercent: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boil Time (min)
              </label>
              <input
                type="number"
                value={currentRecipe.equipment.boilTimeMin}
                onChange={(e) =>
                  updateRecipe({
                    equipment: {
                      ...currentRecipe.equipment,
                      boilTimeMin: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Fermentables - Now using dedicated component with preset picker */}
        <FermentableSection />

        {/* Hops - Phase 3 addition */}
        <HopSection />

        {/* Calculations Display */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Calculated Values
          </h2>
          {calculations ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">OG</div>
                <div className="text-2xl font-bold text-gray-900">
                  {calculations.og.toFixed(3)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">FG</div>
                <div className="text-2xl font-bold text-gray-900">
                  {calculations.fg.toFixed(3)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">ABV</div>
                <div className="text-2xl font-bold text-green-600">
                  {calculations.abv.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">IBU</div>
                <div className="text-2xl font-bold text-gray-900">
                  {calculations.ibu.toFixed(1)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">SRM</div>
                <div className="text-2xl font-bold text-amber-600">
                  {calculations.srm.toFixed(1)}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No calculations available</p>
          )}
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={saveCurrentRecipe}
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
          >
            Save Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
