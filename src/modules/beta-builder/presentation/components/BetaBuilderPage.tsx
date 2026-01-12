/**
 * Beta Builder Page
 *
 * This is your SwiftUI "View" - pure UI, no business logic.
 * It uses the store (like @ObservedObject) and hooks (for calculations).
 */

import { useEffect } from 'react';
import { useRecipeStore } from '../stores/recipeStore';
import { useRecipeCalculations } from '../hooks/useRecipeCalculations';
import type { Fermentable } from '../../domain/models/Recipe';

export default function BetaBuilderPage() {
  const {
    currentRecipe,
    createNewRecipe,
    updateRecipe,
    saveCurrentRecipe,
    addFermentable,
    removeFermentable,
  } = useRecipeStore();

  const calculations = useRecipeCalculations(currentRecipe);

  // Create a new recipe on mount if none exists
  useEffect(() => {
    if (!currentRecipe) {
      createNewRecipe();
    }
  }, [currentRecipe, createNewRecipe]);

  // Handler to add a sample fermentable
  const handleAddFermentable = () => {
    const newFermentable: Fermentable = {
      id: crypto.randomUUID(),
      name: '2-Row Pale Malt',
      weightKg: 5,
      colorLovibond: 2,
      ppg: 37,
      efficiencyPercent: 75,
    };
    addFermentable(newFermentable);
  };

  if (!currentRecipe) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Beta Builder - Clean Architecture
          </h1>
          <p className="text-blue-700">
            This is the new refactored version using SwiftUI-style architecture:
            Domain Services (Managers) + Repositories (Data Layer) + Presentation (Views)
          </p>
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

        {/* Fermentables */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Fermentables</h2>
            <button
              onClick={handleAddFermentable}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Fermentable
            </button>
          </div>

          {currentRecipe.fermentables.length === 0 ? (
            <p className="text-gray-500 italic">
              No fermentables yet. Click "Add Fermentable" to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {currentRecipe.fermentables.map((fermentable) => (
                <div
                  key={fermentable.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div>
                    <span className="font-medium">{fermentable.name}</span>
                    <span className="text-gray-600 ml-3">
                      {fermentable.weightKg} kg
                    </span>
                  </div>
                  <button
                    onClick={() => removeFermentable(fermentable.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
            Save Recipe to localStorage
          </button>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Saved recipes use key: "beta-recipes-v1" (separate from old builder)
          </p>
        </div>

        {/* Architecture Notes */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold mb-2 text-gray-800">
            Architecture Notes:
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              <strong>Models:</strong> Recipe, Fermentable, Hop types (your Swift
              structs)
            </li>
            <li>
              <strong>Services:</strong> RecipeCalculationService (your Manager -
              all calculation logic)
            </li>
            <li>
              <strong>Repository:</strong> RecipeRepository (your Data Layer -
              localStorage)
            </li>
            <li>
              <strong>Store:</strong> useRecipeStore (your @Published properties)
            </li>
            <li>
              <strong>Hooks:</strong> useRecipeCalculations (adapter - makes service
              reactive)
            </li>
            <li>
              <strong>Components:</strong> This page (your SwiftUI View - pure UI)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
