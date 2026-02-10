/**
 * Yeast Section Component
 *
 * Displays yeast selection with:
 * - Preset picker modal for selecting yeast
 * - Display of selected yeast with attenuation
 * - Inline editing of attenuation
 * - Integrated starter calculator
 * - Clear button to remove yeast
 */

import { useEffect, useState, useMemo } from "react";
import { useRecipeStore } from "../stores/recipeStore";
import { usePresetStore } from "../stores/presetStore";
import { useRecipeCalculations } from "../hooks/useRecipeCalculations";
import type { Yeast, YeastType, StarterStep, StarterInfo } from "../../domain/models/Recipe";
import type { YeastPreset } from "../../domain/models/Presets";
import { starterCalculationService } from "../../domain/services/StarterCalculationService";
import CustomYeastModal from "./CustomYeastModal";
import PresetPickerModal from "./PresetPickerModal";

// Import brand favicons
import escarpmentFavicon from "../../../../assets/yeast-favicons/escarpment-favicon.png";
import fermentisFavicon from "../../../../assets/yeast-favicons/fermentis-favicon.png";
import imperialFavicon from "../../../../assets/yeast-favicons/imperial-favicon.svg";
import lallemandFavicon from "../../../../assets/yeast-favicons/lallemand-favicon.png";
import omegaFavicon from "../../../../assets/yeast-favicons/omega-favicon.png";
import whitelabsFavicon from "../../../../assets/yeast-favicons/whitelabs-favicon.jpg";
import wyeastFavicon from "../../../../assets/yeast-favicons/wyeast-favicon.png";

const LABORATORY_FAVICONS: Record<string, string> = {
  "Escarpment Labs": escarpmentFavicon,
  "Fermentis": fermentisFavicon,
  "Imperial Yeast": imperialFavicon,
  "Lallemand": lallemandFavicon,
  "Omega Yeast": omegaFavicon,
  "White Labs": whitelabsFavicon,
  "Wyeast": wyeastFavicon,
};

const getFavicon = (lab: string | undefined) => {
  if (!lab) return null;
  // Try direct match
  if (LABORATORY_FAVICONS[lab]) return LABORATORY_FAVICONS[lab];
  // Try fuzzy match
  for (const [key, value] of Object.entries(LABORATORY_FAVICONS)) {
    if (lab.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(lab.toLowerCase())) {
      return value;
    }
  }
  return null;
};

export default function YeastSection() {
  const { currentRecipe, addYeast, updateYeast, removeYeast } = useRecipeStore();

  // Get the first yeast (for backward compatibility with single-yeast UI)
  const currentYeast = currentRecipe?.yeasts?.[0] ?? null;

  // Adapter functions for single-yeast operations
  const setYeast = (yeast: Yeast) => {
    if (currentYeast) {
      // Replace existing yeast by removing old and adding new
      removeYeast(currentYeast.id);
    }
    addYeast(yeast);
  };

  const clearYeast = () => {
    if (currentYeast) {
      removeYeast(currentYeast.id);
    }
  };
  const { yeastPresetsGrouped, loadYeastPresets, saveYeastPreset, isLoading: presetsLoading } =
    usePresetStore();
  const calculations = useRecipeCalculations(currentRecipe);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    categories: [] as string[],
    attenuation: [] as string[], // 'low', 'med', 'high'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isStarterOpen, setIsStarterOpen] = useState(false);

  // Starter state
  const [yeastType, setYeastType] = useState<YeastType>("liquid-100");
  const [packs, setPacks] = useState<number>(1);
  const [mfgDate, setMfgDate] = useState<string>("");
  const [slurryLiters, setSlurryLiters] = useState<number>(0);
  const [slurryBillionPerMl, setSlurryBillionPerMl] = useState<number>(1);
  const [steps, setSteps] = useState<StarterStep[]>([]);

  // Load presets on mount
  useEffect(() => {
    loadYeastPresets();
  }, [loadYeastPresets]);

  // Hydrate starter state from yeast
  useEffect(() => {
    if (currentYeast?.starter) {
      const s = currentYeast.starter;
      setYeastType(s.yeastType);
      setPacks(s.packs);
      setMfgDate(s.mfgDate || "");
      setSlurryLiters(s.slurryLiters || 0);
      setSlurryBillionPerMl(s.slurryBillionPerMl || 1);
      setSteps(s.steps);
    }
  }, [currentYeast]);

  // Handle selecting a yeast from preset
  const handleSelectFromPreset = (preset: YeastPreset) => {
    const newYeast: Yeast = {
      id: crypto.randomUUID(),
      name: preset.name,
      // attenuationPercent in presets is percentage (75 for 75%), convert to decimal
      attenuation: (preset.attenuationPercent || 75) / 100,
      laboratory: preset.category,
    };
    setYeast(newYeast);
    setIsPickerOpen(false);
    setSearchQuery("");
  };

  // Handle saving a custom yeast preset
  const handleSaveCustomPreset = (preset: YeastPreset) => {
    saveYeastPreset(preset);
  };

  // Handle updating yeast attenuation
  const handleUpdateAttenuation = (attenuation: number) => {
    if (!currentYeast) return;
    updateYeast(currentYeast.id, { attenuation });
  };

  // Update starter info in yeast
  const updateStarterInfo = () => {
    if (!currentYeast) return;
    const starterInfo: StarterInfo = {
      yeastType,
      packs,
      mfgDate,
      slurryLiters,
      slurryBillionPerMl,
      steps,
    };
    updateYeast(currentYeast.id, { starter: starterInfo });
  };

  // Update starter whenever inputs change
  useEffect(() => {
    if (currentYeast && isStarterOpen) {
      updateStarterInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yeastType, packs, mfgDate, slurryLiters, slurryBillionPerMl, steps]);

  // Calculate starter results
  const starterResults = useMemo(() => {
    if (!currentRecipe || !calculations) return null;
    return starterCalculationService.calculateStarter(
      currentRecipe.batchVolumeL,
      calculations.og,
      yeastType,
      packs,
      mfgDate,
      slurryLiters,
      slurryBillionPerMl,
      steps
    );
  }, [currentRecipe, calculations, yeastType, packs, mfgDate, slurryLiters, slurryBillionPerMl, steps]);

  const diffB = starterResults
    ? starterResults.cellsAvailableB - starterResults.requiredCellsB
    : 0;

  const finalDiffB = starterResults
    ? starterResults.finalEndB - starterResults.requiredCellsB
    : 0;

  // Summary text for collapsed starter
  const starterSummaryText = useMemo(() => {
    if (isStarterOpen || !starterResults) return "";

    const yeastInfo = (() => {
      if (yeastType === "slurry") {
        return `Slurry ${slurryLiters.toFixed(1)} L @ ${slurryBillionPerMl.toFixed(1)} B/mL`;
      }
      if (yeastType === "dry") {
        const n = Math.max(0, Math.floor(packs));
        return `Dry ${n}×11g`;
      }
      const label = yeastType === "liquid-200" ? "Liquid (200B)" : "Liquid (100B)";
      const n = Math.max(0, Math.floor(packs));
      const mfgPart = mfgDate ? `(Mfg ${mfgDate})` : "";
      return `${n} pack${n === 1 ? "" : "s"} of ${label} ${mfgPart}`;
    })();

    if (starterResults.totalStarterL > 0 && steps.length > 0) {
      const last = steps[steps.length - 1];
      const starterInfo = `${last.liters.toFixed(1)}L @ ${Number(last.gravity).toFixed(3)}`;
      return `${yeastInfo} in a ${starterInfo} starter`;
    }

    return yeastInfo;
  }, [isStarterOpen, starterResults, steps, yeastType, packs, slurryLiters, slurryBillionPerMl, mfgDate]);

  // Filter presets by search query
  // Get available categories
  const availableCategories = useMemo(() => {
    return yeastPresetsGrouped.map((g) => g.label).sort();
  }, [yeastPresetsGrouped]);

  // Filter presets by search query and active filters
  const filteredGrouped = useMemo(() => {
    return yeastPresetsGrouped
      .map((group) => ({
        ...group,
        items: group.items.filter((preset) => {
          // 1. Search Query
          const matchesSearch = preset.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

          // 2. Category Filter (Brand)
          const matchesCategory =
            activeFilters.categories.length === 0 ||
            activeFilters.categories.includes(group.label);

          // 3. Attenuation Filter
          // low < 72%, med 72-76%, high > 76%
          let attCat = "unknown";
          if (preset.attenuationPercent) {
             const att = preset.attenuationPercent * 100;
             if (att < 72) attCat = "low";
             else if (att >= 72 && att <= 76) attCat = "med";
             else if (att > 76) attCat = "high";
          }

          const matchesAttenuation =
            activeFilters.attenuation.length === 0 ||
            activeFilters.attenuation.includes(attCat);

          return matchesSearch && matchesCategory && matchesAttenuation;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [yeastPresetsGrouped, searchQuery, activeFilters]);

  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 border-t-4 border-amber-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Yeast</h2>
        {!currentYeast ? (
          <button
            onClick={() => setIsPickerOpen(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            Select Yeast
          </button>
        ) : (
          <button
            onClick={clearYeast}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Clear Yeast
          </button>
        )}
      </div>

      {/* Yeast Display */}
      {!currentYeast ? (
        <p className="text-gray-500 dark:text-gray-400 italic">
          No yeast selected. Click "Select Yeast" to choose from preset database.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded border border-[rgb(var(--border))]">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Name and Laboratory */}
              <div className="col-span-6 flex items-start gap-4">
                <div className="mt-1">
                  {getFavicon(currentYeast.laboratory) ? (
                    <img
                      src={getFavicon(currentYeast.laboratory)!}
                      alt={currentYeast.laboratory}
                      className="w-8 h-8 rounded-md object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md border border-[rgb(var(--border))] bg-gray-50 flex items-center justify-center text-gray-400 text-xs font-bold uppercase">
                      {(currentYeast.laboratory?.charAt(0) || "Y")}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium text-lg block">{currentYeast.name}</span>
                  {currentYeast.laboratory && (
                    <div className="text-sm font-medium text-gray-500">
                      {currentYeast.laboratory}
                    </div>
                  )}
                </div>
              </div>

              {/* Attenuation */}
              <div className="col-span-5">
                <label className="text-xs font-semibold block mb-1">
                  Attenuation
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={(currentYeast.attenuation * 100).toFixed(0)}
                    onChange={(e) =>
                      handleUpdateAttenuation(
                        (parseFloat(e.target.value) || 0) / 100
                      )
                    }
                    className="w-24 px-3 py-2 border border-[rgb(var(--border))] rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    step="1"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm font-medium">%</span>
                </div>
              </div>

              {/* Change Button */}
              <div className="col-span-1 text-right">
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Starter Calculator */}
          <div className="border border-[rgb(var(--border))] rounded-lg">
            <div className="flex items-center justify-between p-4 bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))]">
              <div className="flex items-center gap-3">
                <span className="font-medium">Pitch Rate & Starter</span>
                {!isStarterOpen && starterSummaryText && (
                  <span className="text-xs font-medium">{starterSummaryText}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsStarterOpen(!isStarterOpen)}
                className="text-xs px-3 py-1.5 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--card))] transition-colors"
              >
                {isStarterOpen ? "Hide Calculator" : "Show Calculator"}
              </button>
            </div>

            {isStarterOpen && starterResults && (
              <div className="p-4 space-y-4">
                {/* Part 1: Cells */}
                <div className="rounded-lg border border-[rgb(var(--border))] p-4 space-y-3">
                  <div className="text-sm font-semibold">
                    Part 1: Cells
                  </div>

                  {/* Package inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <label className="block">
                      <div className="text-xs font-semibold mb-1">Package Type</div>
                      <select
                        className="w-full rounded-md border border-[rgb(var(--border))] px-2 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={yeastType}
                        onChange={(e) => setYeastType(e.target.value as YeastType)}
                      >
                        <option value="liquid-100">Liquid (100B)</option>
                        <option value="liquid-200">Liquid (200B)</option>
                        <option value="dry">Dry (11g pkt)</option>
                        <option value="slurry">Slurry</option>
                      </select>
                    </label>

                    {yeastType === "slurry" ? (
                      <>
                        <label className="block">
                          <div className="text-xs font-semibold mb-1">
                            Slurry Amount (L)
                          </div>
                          <input
                            className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            type="number"
                            step={0.1}
                            min={0}
                            value={slurryLiters}
                            onChange={(e) => setSlurryLiters(Number(e.target.value))}
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs font-semibold mb-1">
                            Density (B/mL)
                          </div>
                          <input
                            className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            type="number"
                            step={0.1}
                            min={0}
                            value={slurryBillionPerMl}
                            onChange={(e) =>
                              setSlurryBillionPerMl(Number(e.target.value))
                            }
                          />
                        </label>
                      </>
                    ) : yeastType === "dry" ? (
                      <label className="block">
                        <div className="text-xs font-semibold mb-1">Packs</div>
                        <input
                          className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          type="number"
                          step={1}
                          min={0}
                          value={packs}
                          onChange={(e) => setPacks(Number(e.target.value))}
                        />
                      </label>
                    ) : (
                      <>
                        <label className="block">
                          <div className="text-xs font-semibold mb-1">Packs</div>
                          <input
                            className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            type="number"
                            step={1}
                            min={0}
                            value={packs}
                            onChange={(e) => setPacks(Number(e.target.value))}
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs font-semibold mb-1">Mfg Date</div>
                          <input
                            className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            type="date"
                            value={mfgDate}
                            onChange={(e) => setMfgDate(e.target.value)}
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {/* Cell counts */}
                  <div className="text-sm flex flex-wrap gap-x-6 gap-y-2">
                    <span>
                      <span className="text-gray-600 dark:text-gray-400">Available:</span>{" "}
                      <span className="font-semibold">
                        {starterResults.cellsAvailableB.toFixed(0)} B
                      </span>
                    </span>
                    <span>
                      <span className="text-gray-600 dark:text-gray-400">Required:</span>{" "}
                      <span className="font-semibold">
                        {starterResults.requiredCellsB.toFixed(0)} B
                      </span>
                    </span>
                    <span>
                      <span className="text-gray-600 dark:text-gray-400">Diff:</span>{" "}
                      <span
                        className={`font-semibold ${
                          diffB < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {(diffB >= 0 ? "+" : "") + diffB.toFixed(0)} B
                      </span>
                    </span>
                  </div>
                </div>

                {/* Part 2: Starter Steps */}
                <div className="rounded-lg border border-[rgb(var(--border))] p-4 space-y-3">
                  <div className="text-sm font-semibold">
                    Part 2: Starter (up to 3 steps)
                  </div>

                  <div className="space-y-3">
                    {steps.map((s, i) => {
                      const res = starterResults.stepResults[i];
                      return (
                        <div
                          key={s.id}
                          className="grid grid-cols-1 gap-3 items-end sm:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_auto]"
                        >
                          <div className="text-xs font-semibold">Step {i + 1}</div>

                          <label className="block">
                            <div className="text-xs font-semibold mb-1">Size (L)</div>
                            <input
                              className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              type="number"
                              step={0.1}
                              value={s.liters}
                              onChange={(e) =>
                                setSteps((xs) =>
                                  xs.map((x) =>
                                    x.id === s.id
                                      ? { ...x, liters: Number(e.target.value) }
                                      : x
                                  )
                                )
                              }
                            />
                          </label>

                          <label className="block">
                            <div className="text-xs font-semibold mb-1">
                              Gravity (SG)
                            </div>
                            <input
                              className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              type="number"
                              step={0.001}
                              value={s.gravity}
                              onChange={(e) =>
                                setSteps((xs) =>
                                  xs.map((x) =>
                                    x.id === s.id
                                      ? { ...x, gravity: Number(e.target.value) }
                                      : x
                                  )
                                )
                              }
                            />
                          </label>

                          <label className="block">
                            <div className="text-xs font-semibold mb-1">Model</div>
                            <select
                              className="w-full rounded-md border border-[rgb(var(--border))] px-2 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              value={
                                s.model.kind === "white"
                                  ? `white-${s.model.aeration}`
                                  : "braukaiser"
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                setSteps((xs) =>
                                  xs.map((x) =>
                                    x.id === s.id
                                      ? v.startsWith("white-")
                                        ? {
                                            ...x,
                                            model: {
                                              kind: "white",
                                              aeration: v.replace(
                                                "white-",
                                                ""
                                              ) as "none" | "shaking",
                                            },
                                          }
                                        : { ...x, model: { kind: "braukaiser" } }
                                      : x
                                  )
                                );
                              }}
                            >
                              <option value="white-none">No agitation</option>
                              <option value="white-shaking">Shaking</option>
                              <option value="braukaiser">Stir Plate</option>
                            </select>
                          </label>

                          <div className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
                            <div className="text-[11px]">DME (g)</div>
                            <div className="font-semibold text-sm">
                              {res?.dmeGrams.toFixed(0) ?? "–"}
                            </div>
                          </div>

                          <div className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
                            <div className="text-[11px]">End (B)</div>
                            <div className="font-semibold text-sm">
                              {res?.endBillion.toFixed(0) ?? "–"}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="p-2 hover:text-red-600"
                            onClick={() =>
                              setSteps((xs) => xs.filter((x) => x.id !== s.id))
                            }
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                    {steps.length > 0 && (
                      <div className="text-sm flex justify-end gap-x-6">
                        <span>
                          <span className="text-gray-600 dark:text-gray-400">Final:</span>{" "}
                          <span className="font-semibold">
                            {starterResults.finalEndB.toFixed(0)} B
                          </span>
                        </span>
                        <span>
                          <span className="text-gray-600 dark:text-gray-400">Diff:</span>{" "}
                          <span
                            className={`font-semibold ${
                              finalDiffB < 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {(finalDiffB >= 0 ? "+" : "") + finalDiffB.toFixed(0)} B
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-start">
                      <button
                        type="button"
                        className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs hover:bg-[rgb(var(--bg))]"
                        onClick={() =>
                          setSteps((xs) =>
                            xs.length >= 3
                              ? xs
                              : [
                                  ...xs,
                                  {
                                    id: crypto.randomUUID(),
                                    liters: 2,
                                    gravity: 1.036,
                                    model: { kind: "white", aeration: "shaking" },
                                  },
                                ]
                          )
                        }
                        disabled={steps.length >= 3}
                      >
                        + Add Step
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preset Picker Modal */}
      <PresetPickerModal<YeastPreset>
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setSearchQuery("");
        }}
        title="Select Yeast"
        searchPlaceholder="Search yeasts..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filterContent={
          <>
            {/* Attenuation Filters */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="py-1 px-2 font-semibold text-gray-500 uppercase tracking-wider">
                Attenuation:
              </span>
              {[
                { id: "low", label: "Low (<72%)" },
                { id: "med", label: "Med (72-76%)" },
                { id: "high", label: "High (>76%)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleFilter("attenuation", opt.id)}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    activeFilters.attenuation.includes(opt.id)
                      ? "bg-amber-600 text-white border-amber-700 ring-1 ring-amber-500"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide text-xs">
              <span className="py-1 px-2 font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-[rgb(var(--card))] z-10">
                Brand:
              </span>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleFilter("categories", cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors border ${
                    activeFilters.categories.includes(cat)
                      ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800"
                      : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </>
        }
        groups={filteredGrouped}
        isLoading={presetsLoading}
        emptyMessage="No yeasts found"
        renderItem={(preset) => (
          <button
            key={preset.name}
            onClick={() => handleSelectFromPreset(preset)}
            className="w-full text-left px-4 py-3 rounded hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors flex justify-between items-center group"
          >
            <div className="flex items-center gap-3">
              {getFavicon(preset.category) ? (
                <img
                  src={getFavicon(preset.category)!}
                  alt={preset.category}
                  className="w-6 h-6 rounded-sm object-contain group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="w-6 h-6 rounded-sm border border-[rgb(var(--border))] bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                  {preset.category.charAt(0)}
                </div>
              )}
              <span className="font-medium">{preset.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-500">
              {preset.attenuationPercent
                ? `${(preset.attenuationPercent * 100).toFixed(0)}%`
                : "–"}
            </span>
          </button>
        )}
        totalCount={yeastPresetsGrouped.reduce(
          (sum, group) => sum + group.items.length,
          0
        )}
        countLabel="yeast strains available"
        onCreateCustom={() => setIsCustomModalOpen(true)}
        colorScheme="amber"
      />

      {/* Custom Yeast Modal */}
      <CustomYeastModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomPreset}
      />
    </div>
  );
}
