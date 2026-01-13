/**
 * Hop Section Component
 *
 * Displays the hop schedule with:
 * - Preset picker modal for adding hops
 * - Timing controls (boil, whirlpool, dry hop, first wort, mash)
 * - Inline editing of hop properties
 * - Per-hop IBU contribution and g/L display
 * - Remove buttons
 */

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRecipeStore } from "../stores/recipeStore";
import { usePresetStore } from "../stores/presetStore";
import { useRecipeCalculations } from "../hooks/useRecipeCalculations";
import type { Hop } from "../../domain/models/Recipe";
import type { HopPreset, HopFlavorProfile } from "../../domain/models/Presets";
import { hopFlavorCalculationService } from "../../domain/services/HopFlavorCalculationService";
import { recipeCalculationService } from "../../domain/services/RecipeCalculationService";
import HopFlavorMini from "./HopFlavorMini";
import HopFlavorRadar from "./HopFlavorRadar";
import CustomHopModal from "./CustomHopModal";

export default function HopSection() {
  const { currentRecipe, addHop, updateHop, removeHop } = useRecipeStore();
  const { hopPresetsGrouped, hopPresets, loadHopPresets, saveHopPreset, isLoading: presetsLoading } =
    usePresetStore();
  const calculations = useRecipeCalculations(currentRecipe);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredHopName, setHoveredHopName] = useState<string | null>(null);
  const [hoveredHopPosition, setHoveredHopPosition] = useState<{ x: number; y: number } | null>(null);
  const [flavorViewMode, setFlavorViewMode] = useState<"combined" | "individual">("individual");

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
    // Clear hover state when closing modal
    setHoveredHopName(null);
    setHoveredHopPosition(null);
  };

  // Handle hover with position tracking
  const handleHopHover = (preset: HopPreset, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredHopName(preset.name);
    setHoveredHopPosition({
      x: rect.right + 8,
      y: rect.top,
    });
  };

  const handleHopLeave = () => {
    setHoveredHopName(null);
    setHoveredHopPosition(null);
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

  // Get the hovered hop preset for tooltip
  const hoveredPreset = hoveredHopName
    ? hopPresets.find((p) => p.name === hoveredHopName)
    : null;

  // Calculate total hop weight
  const totalHopGrams =
    currentRecipe?.hops.reduce((sum, h) => sum + h.grams, 0) || 0;

  // Build flavor map from presets (memoized for performance)
  const hopFlavorMap = useMemo(() => {
    const map = new Map<string, HopFlavorProfile>();
    for (const preset of hopPresets) {
      if (preset.flavor) {
        map.set(preset.name, preset.flavor);
      }
    }
    return map;
  }, [hopPresets]);

  // Calculate combined flavor profile using domain service
  const combinedFlavor = useMemo(() => {
    if (!currentRecipe || currentRecipe.hops.length === 0) {
      return null;
    }
    return hopFlavorCalculationService.calculateCombinedFlavor(
      currentRecipe.hops,
      hopFlavorMap,
      currentRecipe.batchVolumeL
    );
  }, [currentRecipe?.hops, currentRecipe?.batchVolumeL, hopFlavorMap]);

  // Calculate per-hop IBU contributions using RecipeCalculationService
  const calculateHopIBU = (hop: Hop): number => {
    if (!currentRecipe || !calculations) return 0;
    const batchVolumeGal = currentRecipe.batchVolumeL * 0.264172;
    return recipeCalculationService.calculateSingleHopIBU(hop, calculations.og, batchVolumeGal);
  };

  // Handle saving a custom hop preset
  const handleSaveCustomPreset = (preset: HopPreset) => {
    saveHopPreset(preset);
  };

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
        <p className="text-gray-700 italic">
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
                  <div className="text-xs font-medium text-gray-700">
                    {hop.alphaAcid.toFixed(1)}% AA
                  </div>
                  <div className="text-xs text-gray-600">
                    {calculateHopIBU(hop).toFixed(1)} IBU • {(hop.grams / (currentRecipe?.batchVolumeL || 1)).toFixed(2)} g/L
                  </div>
                </div>

                {/* Weight */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
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
                    <span className="text-xs font-medium text-gray-700">g</span>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
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

                {/* Boil Time */}
                {hop.type === "boil" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Boil Time
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
                      <span className="text-xs font-medium text-gray-700">min</span>
                    </div>
                  </div>
                )}

                {/* Whirlpool Temperature */}
                {hop.type === "whirlpool" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
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
                      <span className="text-xs font-medium text-gray-700">°C</span>
                    </div>
                  </div>
                )}

                {/* Whirlpool Time */}
                {hop.type === "whirlpool" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Time
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={hop.whirlpoolTimeMinutes || 15}
                        onChange={(e) =>
                          updateHop(hop.id, {
                            whirlpoolTimeMinutes: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        step="5"
                        min="0"
                      />
                      <span className="text-xs font-medium text-gray-700">min</span>
                    </div>
                  </div>
                )}

                {/* Dry Hop Start Day */}
                {hop.type === "dry hop" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Start Day
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={hop.dryHopStartDay ?? 0}
                        onChange={(e) =>
                          updateHop(hop.id, {
                            dryHopStartDay: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        step="1"
                        min="0"
                      />
                      <span className="text-xs font-medium text-gray-700">day</span>
                    </div>
                  </div>
                )}

                {/* Dry Hop Duration */}
                {hop.type === "dry hop" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Duration
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={hop.dryHopDays ?? 3}
                        onChange={(e) =>
                          updateHop(hop.id, {
                            dryHopDays: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        step="1"
                        min="0"
                      />
                      <span className="text-xs font-medium text-gray-700">days</span>
                    </div>
                  </div>
                )}

                {/* Spacer for alignment when no timing fields */}
                {hop.type !== "boil" &&
                  hop.type !== "whirlpool" &&
                  hop.type !== "dry hop" && (
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Hop Flavor Profile</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFlavorViewMode("individual")}
                    className={`px-3 py-1 text-xs rounded ${
                      flavorViewMode === "individual"
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    Preset
                  </button>
                  <button
                    onClick={() => setFlavorViewMode("combined")}
                    className={`px-3 py-1 text-xs rounded ${
                      flavorViewMode === "combined"
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    Estimated
                  </button>
                </div>
              </div>
              <HopFlavorRadar
                series={
                  flavorViewMode === "combined" && combinedFlavor
                    ? [{ name: "Total (est.)", flavor: combinedFlavor }]
                    : currentRecipe.hops
                        .map((hop) => {
                          const preset = hopPresets.find((p) => p.name === hop.name);
                          return preset?.flavor
                            ? { name: hop.name, flavor: preset.flavor }
                            : null;
                        })
                        .filter((s): s is { name: string; flavor: HopFlavorProfile } => s !== null)
                }
                maxValue={5}
                size={280}
                emptyHint="No flavor data available"
                title={
                  flavorViewMode === "combined"
                    ? "Estimated final aroma emphasis"
                    : "Base hop profiles"
                }
                colorStrategy={flavorViewMode === "combined" ? "dominant" : "index"}
                showLegend={flavorViewMode === "individual"}
                labelColorize={true}
                outerPadding={72}
                ringRadius={100}
              />
            </div>
          )}
        </div>
      )}

      {/* Preset Picker Modal */}
      {isPickerOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          onClick={() => {
            setIsPickerOpen(false);
            setSearchQuery("");
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
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
            <div className="flex-1 overflow-y-auto overflow-x-visible p-6">
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
                          <button
                            key={preset.name}
                            onClick={() => handleAddFromPreset(preset)}
                            onMouseEnter={(e) => handleHopHover(preset, e)}
                            onMouseLeave={handleHopLeave}
                            className="w-full text-left px-4 py-2 rounded hover:bg-green-50 transition-colors flex justify-between items-center"
                          >
                            <div className="flex items-center gap-3">
                              {preset.flavor && (
                                <HopFlavorMini flavor={preset.flavor} size={24} />
                              )}
                              <span className="font-medium">{preset.name}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {preset.alphaAcidPercent.toFixed(1)}% AA
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
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {hopPresetsGrouped.reduce(
                  (sum, group) => sum + group.items.length,
                  0
                )}{" "}
                hop varieties available
              </div>
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                + Create Custom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Hop Modal */}
      <CustomHopModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomPreset}
      />

      {/* Tooltip Portal - Rendered outside modal to prevent clipping */}
      {isPickerOpen && hoveredPreset && hoveredPreset.flavor && hoveredHopPosition &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: `${hoveredHopPosition.x}px`,
              top: `${hoveredHopPosition.y}px`,
              zIndex: 9999,
            }}
            className="bg-white border-2 border-green-400 rounded-lg shadow-2xl p-4 pointer-events-none"
          >
            <div className="text-sm font-semibold mb-2 text-gray-900 text-center">
              {hoveredPreset.name}
            </div>
            <HopFlavorRadar
              series={[{ name: hoveredPreset.name, flavor: hoveredPreset.flavor }]}
              maxValue={5}
              size={240}
              showLegend={false}
              labelColorize={true}
              outerPadding={50}
              ringRadius={70}
              colorStrategy="dominant"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
