/**
 * Fermentable Section Component
 *
 * Displays the grain bill with:
 * - Preset picker modal for adding fermentables
 * - Inline editing of fermentable properties
 * - Per-grain contribution display
 * - Remove buttons
 */

import { useEffect, useState } from "react";
import { useRecipeStore } from "../stores/recipeStore";
import { usePresetStore } from "../stores/presetStore";
import type { Fermentable } from "../../domain/models/Recipe";
import type { FermentablePreset } from "../../domain/models/Presets";

export default function FermentableSection() {
  const { currentRecipe, addFermentable, updateFermentable, removeFermentable } =
    useRecipeStore();
  const {
    fermentablePresetsGrouped,
    loadFermentablePresets,
    isLoading: presetsLoading,
  } = usePresetStore();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load presets on mount
  useEffect(() => {
    loadFermentablePresets();
  }, [loadFermentablePresets]);

  // Handle adding a fermentable from preset
  const handleAddFromPreset = (preset: FermentablePreset) => {
    const newFermentable: Fermentable = {
      id: crypto.randomUUID(),
      name: preset.name,
      weightKg: 1.0, // Default weight
      colorLovibond: preset.colorLovibond,
      ppg: preset.potentialGu,
      efficiencyPercent:
        preset.type === "extract" || preset.type === "sugar" ? 100 : 75,
    };
    addFermentable(newFermentable);
    setIsPickerOpen(false);
    setSearchQuery("");
  };

  // Filter presets by search query
  const filteredGrouped = fermentablePresetsGrouped.map((group) => ({
    ...group,
    items: group.items.filter((preset) =>
      preset.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  // Calculate total grain weight
  const totalGrainKg =
    currentRecipe?.fermentables.reduce((sum, f) => sum + f.weightKg, 0) || 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Fermentables</h2>
        <button
          onClick={() => setIsPickerOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Fermentable
        </button>
      </div>

      {/* Fermentable List */}
      {!currentRecipe?.fermentables.length ? (
        <p className="text-gray-500 italic">
          No fermentables yet. Click "Add Fermentable" to select from preset database.
        </p>
      ) : (
        <div className="space-y-2">
          {currentRecipe.fermentables.map((fermentable) => {
            const percentage = totalGrainKg > 0
              ? (fermentable.weightKg / totalGrainKg) * 100
              : 0;

            return (
              <div
                key={fermentable.id}
                className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                {/* Name */}
                <div className="col-span-4">
                  <span className="font-medium">{fermentable.name}</span>
                </div>

                {/* Weight - Inline Editable */}
                <div className="col-span-2">
                  <input
                    type="number"
                    value={fermentable.weightKg}
                    onChange={(e) =>
                      updateFermentable(fermentable.id, {
                        weightKg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="0.1"
                    min="0"
                  />
                  <span className="text-xs text-gray-500">kg</span>
                </div>

                {/* Color - Inline Editable */}
                <div className="col-span-2">
                  <input
                    type="number"
                    value={fermentable.colorLovibond}
                    onChange={(e) =>
                      updateFermentable(fermentable.id, {
                        colorLovibond: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="1"
                    min="0"
                  />
                  <span className="text-xs text-gray-500">°L</span>
                </div>

                {/* PPG - Inline Editable */}
                <div className="col-span-2">
                  <input
                    type="number"
                    value={fermentable.ppg}
                    onChange={(e) =>
                      updateFermentable(fermentable.id, {
                        ppg: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    step="0.1"
                    min="0"
                  />
                  <span className="text-xs text-gray-500">PPG</span>
                </div>

                {/* Percentage */}
                <div className="col-span-1 text-right">
                  <span className="text-sm text-gray-600">
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Remove Button */}
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => removeFermentable(fermentable.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-300 mt-2">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">{totalGrainKg.toFixed(2)} kg</span>
          </div>
        </div>
      )}

      {/* Preset Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Select Fermentable</h3>
                <button
                  onClick={() => {
                    setIsPickerOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search fermentables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Modal Body - Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6">
              {presetsLoading ? (
                <p className="text-gray-500">Loading presets...</p>
              ) : filteredGrouped.length === 0 ? (
                <p className="text-gray-500">No fermentables found</p>
              ) : (
                <div className="space-y-6">
                  {filteredGrouped.map((group) => (
                    <div key={group.label}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                        {group.label}
                      </h4>
                      <div className="space-y-1">
                        {group.items.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => handleAddFromPreset(preset)}
                            className="w-full text-left px-4 py-2 rounded hover:bg-blue-50 transition-colors flex justify-between items-center"
                          >
                            <span className="font-medium">{preset.name}</span>
                            <span className="text-sm text-gray-600">
                              {preset.colorLovibond}°L | {preset.potentialGu} PPG
                              {preset.originCode && ` | ${preset.originCode}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              {fermentablePresetsGrouped.reduce(
                (sum, group) => sum + group.items.length,
                0
              )}{" "}
              presets available
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
