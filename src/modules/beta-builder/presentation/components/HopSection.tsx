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
  const [activeFilters, setActiveFilters] = useState({
    origins: [] as string[],
    flavors: [] as string[],
    alphas: [] as string[], // 'low', 'med', 'high', 'super'
  });
  const [showFilters, setShowFilters] = useState(false);
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
      flavor: preset.flavor,
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
  // Get available categories
  const availableCategories = useMemo(() => {
    return hopPresetsGrouped.map((g) => g.label).sort();
  }, [hopPresetsGrouped]);

  // Filter presets by search query and active filters
  const filteredGrouped = useMemo(() => {
    return hopPresetsGrouped
      .map((group) => ({
        ...group,
        items: group.items.filter((preset) => {
          // 1. Search Query
          const matchesSearch = preset.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

          // 2. Origin Filter (matches group label usually, or explicit logic if we had country codes)
          // Using group.label as proxy for Category/Origin
          const matchesOrigin =
            activeFilters.origins.length === 0 ||
            activeFilters.origins.includes(group.label);

          // 3. Alpha Filter
          // low < 5, med 5-10, high 10-15, super > 15
          let alphaCat = "low";
          if (preset.alphaAcidPercent >= 5 && preset.alphaAcidPercent < 10) alphaCat = "med";
          else if (preset.alphaAcidPercent >= 10 && preset.alphaAcidPercent < 15) alphaCat = "high";
          else if (preset.alphaAcidPercent >= 15) alphaCat = "super";

          const matchesAlpha =
            activeFilters.alphas.length === 0 ||
            activeFilters.alphas.includes(alphaCat);

          // 4. Flavor Filter
          // Match if ANY of the selected flavors has a value > 0 (or threshold > 2?)
          // Let's say threshold 3 for "dominant"
          const matchesFlavor =
            activeFilters.flavors.length === 0 ||
            (preset.flavor && activeFilters.flavors.some(f => (preset.flavor as any)[f] >= 3));

          return matchesSearch && matchesOrigin && matchesAlpha && matchesFlavor;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [hopPresetsGrouped, searchQuery, activeFilters]);

  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

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
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 border-t-4 border-green-500">
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
        <p className="text-gray-500 dark:text-gray-400 italic">
          No hops yet. Click "Add Hop" to select from preset database.
        </p>
      ) : (
        <div className="space-y-3">
          {currentRecipe.hops.map((hop) => (
            <div
              key={hop.id}
              className="p-4 bg-[rgb(var(--card))] rounded border border-[rgb(var(--border))] hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors"
            >
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Name */}
                <div className="col-span-3 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    {hop.flavor && <HopFlavorMini flavor={hop.flavor} size={32} className="min-w-[32px]" />}
                    <span className="font-medium truncate">{hop.name}</span>
                  </div>
                  <div className="text-xs font-medium">
                    {hop.alphaAcid.toFixed(1)}% AA
                  </div>
                  <div className="text-xs">
                    {calculateHopIBU(hop).toFixed(1)} IBU • {(hop.grams / (currentRecipe?.batchVolumeL || 1)).toFixed(2)} g/L
                  </div>
                </div>

                {/* Weight */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold block mb-1">
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
                    className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded dark:bg-gray-800 dark:text-gray-100"
                      step="1"
                      min="0"
                    />
                    <span className="text-xs font-medium">g</span>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <label className="text-xs font-semibold block mb-1">
                    Type
                  </label>
                  <select
                    value={hop.type}
                    onChange={(e) =>
                      updateHop(hop.id, {
                        type: e.target.value as Hop["type"],
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded"
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
                    <label className="text-xs font-semibold block mb-1">
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
                        className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        step="5"
                        min="0"
                      />
                      <span className="text-xs font-medium">min</span>
                    </div>
                  </div>
                )}

                {/* Whirlpool Temperature */}
                {hop.type === "whirlpool" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold block mb-1">
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
                        className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        step="5"
                        min="40"
                        max="100"
                      />
                      <span className="text-xs font-medium">°C</span>
                    </div>
                  </div>
                )}

                {/* Whirlpool Time */}
                {hop.type === "whirlpool" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold block mb-1">
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
                        className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        step="5"
                        min="0"
                      />
                      <span className="text-xs font-medium">min</span>
                    </div>
                  </div>
                )}

                {/* Dry Hop Start Day */}
                {hop.type === "dry hop" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold block mb-1">
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
                        className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        step="1"
                        min="0"
                      />
                      <span className="text-xs font-medium">day</span>
                    </div>
                  </div>
                )}

                {/* Dry Hop Duration */}
                {hop.type === "dry hop" && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold block mb-1">
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
                        className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        step="1"
                        min="0"
                      />
                      <span className="text-xs font-medium">days</span>
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
          <div className="flex justify-between items-center pt-2 border-t border-[rgb(var(--border))] mt-2">
            <span className="font-semibold">Total Hops</span>
            <span className="font-semibold">{totalHopGrams} g</span>
          </div>

          {/* Hop Flavor Visualizer */}
          {currentRecipe.hops.length > 0 && (
            <div className="mt-6 p-4 rounded-lg border border-[rgb(var(--border))]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">Hop Flavor Profile</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFlavorViewMode("individual")}
                    className={`px-3 py-1 text-xs rounded ${
                      flavorViewMode === "individual"
                        ? "bg-green-600 text-white"
                        : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
                    }`}
                  >
                    Preset
                  </button>
                  <button
                    onClick={() => setFlavorViewMode("combined")}
                    className={`px-3 py-1 text-xs rounded ${
                      flavorViewMode === "combined"
                        ? "bg-green-600 text-white"
                        : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
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
            className="bg-[rgb(var(--card))] rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[rgb(var(--border))]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Select Hop</h3>
                <button
                  onClick={() => {
                    setIsPickerOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Search */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Search hops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  autoFocus
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-md border transition-colors ${
                    showFilters
                      ? "bg-amber-100 text-amber-600 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                  }`}
                  title="Toggle Filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="space-y-3 mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                 {/* Alpha Filters */}
                 <div className="flex flex-wrap gap-2 text-xs">
                   <span className="py-1 px-2 font-semibold text-gray-500 uppercase tracking-wider">Alpha:</span>
                   {[
                     { id: "low", label: "Low (<5%)", color: "bg-green-50 text-green-700 border-green-200" },
                     { id: "med", label: "Med (5-10%)", color: "bg-green-100 text-green-800 border-green-300" },
                     { id: "high", label: "High (10-15%)", color: "bg-green-200 text-green-900 border-green-400" },
                     { id: "super", label: "Super (>15%)", color: "bg-green-300 text-green-950 border-green-500" }
                   ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleFilter("alphas", opt.id)}
                        className={`px-3 py-1 rounded-full border transition-colors ${
                          activeFilters.alphas.includes(opt.id)
                            ? "bg-green-600 text-white border-green-700 ring-1 ring-green-500"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                   ))}
                 </div>

                 {/* Flavor Filters */}
                 <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide text-xs">
                   <span className="py-1 px-2 font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-[rgb(var(--card))] z-10">Flavor:</span>
                   {["citrus", "tropicalFruit", "stoneFruit", "berry", "floral", "resinPine", "spice", "herbal", "grassy"].map(flavor => {
                      const color = {
                        citrus: "#facc15",
                        tropicalFruit: "#fb923c",
                        stoneFruit: "#f97316",
                        berry: "#a855f7",
                        floral: "#f472b6",
                        resinPine: "#16a34a",
                        spice: "#ef4444",
                        herbal: "#22c55e",
                        grassy: "#84cc16"
                      }[flavor] || "#6b7280";
                      
                      const isActive = activeFilters.flavors.includes(flavor);
                      
                      return (
                      <button
                        key={flavor}
                        onClick={() => toggleFilter("flavors", flavor)}
                        style={isActive ? { backgroundColor: color, borderColor: color, color: flavor === 'citrus' ? '#000' : '#fff' } : {}}
                        className={`px-3 py-1 rounded-full border whitespace-nowrap transition-colors ${
                          isActive
                            ? "" // style takes precedence for active
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                        }`}
                      >
                         {flavor === "resinPine" ? "Resin/Pine" : flavor === "tropicalFruit" ? "Tropical" : flavor === "stoneFruit" ? "Stone Fruit" : flavor.charAt(0).toUpperCase() + flavor.slice(1)}
                      </button>
                   );
                   })}
                 </div>

                 {/* Origin/Category Filters */}
                 <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide text-xs">
                    <span className="py-1 px-2 font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-[rgb(var(--card))] z-10">Region:</span>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleFilter("origins", cat)}
                        className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors border ${
                          activeFilters.origins.includes(cat)
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-100 dark:border-green-800"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
               </div>
              )}
            </div>

            {/* Modal Body - Scrollable List */}
            <div className="flex-1 overflow-y-auto overflow-x-visible pb-4">
              {presetsLoading ? (
                <p className="text-gray-500 dark:text-gray-400">Loading presets...</p>
              ) : filteredGrouped.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 px-6 py-8 text-center">No hops found</p>
              ) : (
                <div className="space-y-6">
                  {filteredGrouped.map((group) => (
                    <div key={group.label}>
                      <h4 className="text-sm font-semibold mb-2 uppercase sticky top-0 z-10 bg-[rgb(var(--card))] px-6 py-2 border-b border-[rgb(var(--border))]">
                        {group.label}
                      </h4>
                      <div className="space-y-1 px-6">
                        {group.items.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => handleAddFromPreset(preset)}
                            onMouseEnter={(e) => handleHopHover(preset, e)}
                            onMouseLeave={handleHopLeave}
                            className="w-full text-left px-4 py-2 rounded hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors flex justify-between items-center"
                          >
                            <div className="flex items-center gap-3">
                              {preset.flavor && (
                                <HopFlavorMini flavor={preset.flavor} size={24} />
                              )}
                              <span className="font-medium">{preset.name}</span>
                            </div>
                            <span className="text-sm font-medium">
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
            <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))] flex justify-between items-center">
              <div className="text-sm">
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
            className="bg-[rgb(var(--card))] border-2 border-green-400 rounded-lg shadow-2xl p-4 pointer-events-none"
          >
            <div className="text-sm font-semibold mb-2 text-center">
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
