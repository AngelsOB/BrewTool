/**
 * Hop Section Component
 *
 * Displays the hop schedule with:
 * - Preset picker modal for adding hops
 * - Timing controls (boil, whirlpool, dry hop, first wort, mash)
 * - Inline editing of hop properties
 * - Per-hop IBU contribution display (future)
 * - Remove buttons
 */

import { useEffect, useState } from "react";
import { useRecipeStore } from "../stores/recipeStore";
import { usePresetStore } from "../stores/presetStore";
import { useRecipeCalculations } from "../hooks/useRecipeCalculations";
import type { Hop } from "../../domain/models/Recipe";
import type { HopPreset, HopFlavorProfile } from "../../domain/models/Presets";
import HopFlavorMini from "./HopFlavorMini";
import HopFlavorRadar from "./HopFlavorRadar";

const EMPTY_FLAVOR: HopFlavorProfile = {
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

export default function HopSection() {
  const { currentRecipe, addHop, updateHop, removeHop } = useRecipeStore();
  const { hopPresetsGrouped, hopPresets, loadHopPresets, isLoading: presetsLoading } =
    usePresetStore();
  const calculations = useRecipeCalculations(currentRecipe);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredHopName, setHoveredHopName] = useState<string | null>(null);

  // Load presets on mount
  useEffect(() => {
    loadHopPresets();
  }, [loadHopPresets]);

  // Handle adding a hop from preset
  const handleAddFromPreset = (preset: HopPreset) => {
    const newHop: Hop = {
      id: crypto.randomUUID(),
      name: preset.name,
      alphaAcid: preset.alphaAcidPercent,
      grams: 30, // Default weight
      type: "boil", // Default to boil
      timeMinutes: 60, // Default to 60 min boil
    };
    addHop(newHop);
    setIsPickerOpen(false);
    setSearchQuery("");
  };

  // Filter presets by search query
  const filteredGrouped = hopPresetsGrouped
    .map((group) => ({
      ...group,
      items: group.items.filter((preset) =>
        preset.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  // Calculate total hop weight
  const totalHopGrams =
    currentRecipe?.hops.reduce((sum, h) => sum + h.grams, 0) || 0;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Hops</h2>
        <button
          onClick={() => setIsPickerOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add Hop
        </button>
      </div>

      {/* Hop List */}
      {!currentRecipe?.hops.length ? (
        <p className="text-gray-500 italic">
          No hops yet. Click "Add Hop" to select from preset database.
        </p>
      ) : (
        <div className="space-y-3">
          {currentRecipe.hops.map((hop) => (
            <div
              key={hop.id}
              className="p-4 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Name */}
                <div className="col-span-3">
                  <span className="font-medium">{hop.name}</span>
                  <div className="text-xs text-gray-500">
                    {hop.alphaAcid.toFixed(1)}% AA
                  </div>
                </div>

                {/* Weight */}
                <div className="col-span-2">
                  <label className="text-xs text-gray-600 block mb-1">
                    Weight
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={hop.grams}
                      onChange={(e) =>
                        updateHop(hop.id, {
                          grams: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      step="1"
                      min="0"
                    />
                    <span className="text-xs text-gray-500">g</span>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <label className="text-xs text-gray-600 block mb-1">
                    Type
                  </label>
                  <select
                    value={hop.type}
                    onChange={(e) =>
                      updateHop(hop.id, {
                        type: e.target.value as Hop["type"],
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="boil">Boil</option>
                    <option value="whirlpool">Whirlpool</option>
                    <option value="dry hop">Dry Hop</option>
                    <option value="first wort">First Wort</option>
                    <option value="mash">Mash</option>
                  </select>
                </div>

                {/* Time (for boil/whirlpool) */}
                {(hop.type === "boil" || hop.type === "whirlpool") && (
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 block mb-1">
                      Time
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={hop.timeMinutes || 0}
                        onChange={(e) =>
                          updateHop(hop.id, {
                            timeMinutes: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        step="5"
                        min="0"
                      />
                      <span className="text-xs text-gray-500">min</span>
                    </div>
                  </div>
                )}

                {/* Temperature (for whirlpool) */}
                {hop.type === "whirlpool" && (
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 block mb-1">
                      Temp
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={hop.temperatureC || 80}
                        onChange={(e) =>
                          updateHop(hop.id, {
                            temperatureC: parseFloat(e.target.value) || 80,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        step="5"
                        min="40"
                        max="100"
                      />
                      <span className="text-xs text-gray-500">°C</span>
                    </div>
                  </div>
                )}

                {/* Spacer for alignment when no time/temp fields */}
                {hop.type !== "boil" &&
                  hop.type !== "whirlpool" && (
                    <div className="col-span-4"></div>
                  )}

                {/* Remove Button */}
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => removeHop(hop.id)}
                    className="text-red-600 hover:text-red-800 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-300 mt-2">
            <span className="font-semibold">Total Hops</span>
            <span className="font-semibold">{totalHopGrams} g</span>
          </div>

          {/* Hop Flavor Visualizer */}
          {currentRecipe.hops.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Estimated Flavor Profile</h3>
              <HopFlavorRadar
                series={currentRecipe.hops
                  .map((hop) => {
                    const preset = hopPresets.find((p) => p.name === hop.name);
                    return preset?.flavor
                      ? { name: hop.name, flavor: preset.flavor }
                      : null;
                  })
                  .filter((s): s is { name: string; flavor: HopFlavorProfile } => s !== null)}
                maxValue={5}
                size={280}
                emptyHint="No flavor data available"
                colorStrategy="index"
                showLegend={true}
                outerPadding={25}
              />
            </div>
          )}
        </div>
      )}

      {/* Preset Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Select Hop</h3>
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
                placeholder="Search hops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
              />
            </div>

            {/* Modal Body - Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6">
              {presetsLoading ? (
                <p className="text-gray-500">Loading presets...</p>
              ) : filteredGrouped.length === 0 ? (
                <p className="text-gray-500">No hops found</p>
              ) : (
                <div className="space-y-6">
                  {filteredGrouped.map((group) => (
                    <div key={group.label}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                        {group.label}
                      </h4>
                      <div className="space-y-1">
                        {group.items.map((preset) => (
                          <div key={preset.name} className="relative">
                            <button
                              onClick={() => handleAddFromPreset(preset)}
                              onMouseEnter={() => setHoveredHopName(preset.name)}
                              onMouseLeave={() => setHoveredHopName(null)}
                              className="w-full text-left px-4 py-2 rounded hover:bg-green-50 transition-colors flex justify-between items-center"
                            >
                              <div className="flex items-center gap-3">
                                {preset.flavor && (
                                  <HopFlavorMini flavor={preset.flavor} size={24} />
                                )}
                                <span className="font-medium">{preset.name}</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {preset.alphaAcidPercent.toFixed(1)}% AA
                              </span>
                            </button>

                            {/* Hover Tooltip */}
                            {hoveredHopName === preset.name && preset.flavor && (
                              <div className="absolute left-full top-0 ml-2 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 w-72">
                                <div className="text-sm font-semibold mb-2">{preset.name}</div>
                                <HopFlavorRadar
                                  series={[{ name: preset.name, flavor: preset.flavor }]}
                                  maxValue={5}
                                  size={200}
                                  showLegend={false}
                                  outerPadding={20}
                                  ringRadius={70}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              {hopPresetsGrouped.reduce(
                (sum, group) => sum + group.items.length,
                0
              )}{" "}
              hop varieties available
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
