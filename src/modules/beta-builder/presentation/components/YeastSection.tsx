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

export default function YeastSection() {
  const { currentRecipe, setYeast, clearYeast } = useRecipeStore();
  const { yeastPresetsGrouped, loadYeastPresets, isLoading: presetsLoading } =
    usePresetStore();
  const calculations = useRecipeCalculations(currentRecipe);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    if (currentRecipe?.yeast?.starter) {
      const s = currentRecipe.yeast.starter;
      setYeastType(s.yeastType);
      setPacks(s.packs);
      setMfgDate(s.mfgDate || "");
      setSlurryLiters(s.slurryLiters || 0);
      setSlurryBillionPerMl(s.slurryBillionPerMl || 1);
      setSteps(s.steps);
    }
  }, [currentRecipe?.yeast]);

  // Handle selecting a yeast from preset
  const handleSelectFromPreset = (preset: YeastPreset) => {
    const newYeast: Yeast = {
      id: crypto.randomUUID(),
      name: preset.name,
      attenuation: preset.attenuationPercent / 100,
      laboratory: preset.category,
    };
    setYeast(newYeast);
    setIsPickerOpen(false);
    setSearchQuery("");
  };

  // Handle updating yeast attenuation
  const handleUpdateAttenuation = (attenuation: number) => {
    if (!currentRecipe?.yeast) return;
    setYeast({
      ...currentRecipe.yeast,
      attenuation,
    });
  };

  // Update starter info in yeast
  const updateStarterInfo = () => {
    if (!currentRecipe?.yeast) return;
    const starterInfo: StarterInfo = {
      yeastType,
      packs,
      mfgDate,
      slurryLiters,
      slurryBillionPerMl,
      steps,
    };
    setYeast({
      ...currentRecipe.yeast,
      starter: starterInfo,
    });
  };

  // Update starter whenever inputs change
  useEffect(() => {
    if (currentRecipe?.yeast && isStarterOpen) {
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
  const filteredGrouped = yeastPresetsGrouped
    .map((group) => ({
      ...group,
      items: group.items.filter((preset) =>
        preset.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Yeast</h2>
        {!currentRecipe?.yeast ? (
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
      {!currentRecipe?.yeast ? (
        <p className="text-gray-500 italic">
          No yeast selected. Click "Select Yeast" to choose from preset database.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded border border-amber-200">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Name and Laboratory */}
              <div className="col-span-6">
                <span className="font-medium text-lg">{currentRecipe.yeast.name}</span>
                {currentRecipe.yeast.laboratory && (
                  <div className="text-sm text-gray-600">
                    {currentRecipe.yeast.laboratory}
                  </div>
                )}
              </div>

              {/* Attenuation */}
              <div className="col-span-5">
                <label className="text-xs text-gray-600 block mb-1">
                  Attenuation
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={(currentRecipe.yeast.attenuation * 100).toFixed(0)}
                    onChange={(e) =>
                      handleUpdateAttenuation(
                        (parseFloat(e.target.value) || 0) / 100
                      )
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded"
                    step="1"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-600">%</span>
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
          <div className="border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">Pitch Rate & Starter</span>
                {!isStarterOpen && starterSummaryText && (
                  <span className="text-xs text-gray-500">{starterSummaryText}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsStarterOpen(!isStarterOpen)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-white transition-colors"
              >
                {isStarterOpen ? "Hide Calculator" : "Show Calculator"}
              </button>
            </div>

            {isStarterOpen && starterResults && (
              <div className="p-4 space-y-4">
                {/* Part 1: Cells */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">
                    Part 1: Cells
                  </div>

                  {/* Package inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <label className="block">
                      <div className="text-xs text-gray-600 mb-1">Package Type</div>
                      <select
                        className="w-full rounded-md border border-gray-300 px-2 py-2"
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
                          <div className="text-xs text-gray-600 mb-1">
                            Slurry Amount (L)
                          </div>
                          <input
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                            type="number"
                            step={0.1}
                            min={0}
                            value={slurryLiters}
                            onChange={(e) => setSlurryLiters(Number(e.target.value))}
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs text-gray-600 mb-1">
                            Density (B/mL)
                          </div>
                          <input
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
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
                        <div className="text-xs text-gray-600 mb-1">Packs</div>
                        <input
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
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
                          <div className="text-xs text-gray-600 mb-1">Packs</div>
                          <input
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                            type="number"
                            step={1}
                            min={0}
                            value={packs}
                            onChange={(e) => setPacks(Number(e.target.value))}
                          />
                        </label>
                        <label className="block">
                          <div className="text-xs text-gray-600 mb-1">Mfg Date</div>
                          <input
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                            type="date"
                            value={mfgDate}
                            onChange={(e) => setMfgDate(e.target.value)}
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {/* Cell counts */}
                  <div className="text-sm text-gray-800 flex flex-wrap gap-x-6 gap-y-2">
                    <span>
                      <span className="text-gray-600">Available:</span>{" "}
                      <span className="font-semibold text-gray-900">
                        {starterResults.cellsAvailableB.toFixed(0)} B
                      </span>
                    </span>
                    <span>
                      <span className="text-gray-600">Required:</span>{" "}
                      <span className="font-semibold text-gray-900">
                        {starterResults.requiredCellsB.toFixed(0)} B
                      </span>
                    </span>
                    <span>
                      <span className="text-gray-600">Diff:</span>{" "}
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
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">
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
                          <div className="text-xs text-gray-600">Step {i + 1}</div>

                          <label className="block">
                            <div className="text-xs text-gray-600 mb-1">Size (L)</div>
                            <input
                              className="w-full rounded-md border border-gray-300 px-3 py-2"
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
                            <div className="text-xs text-gray-600 mb-1">
                              Gravity (SG)
                            </div>
                            <input
                              className="w-full rounded-md border border-gray-300 px-3 py-2"
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
                            <div className="text-xs text-gray-600 mb-1">Model</div>
                            <select
                              className="w-full rounded-md border border-gray-300 px-2 py-2"
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

                          <div className="rounded-md border border-gray-300 bg-white px-3 py-2">
                            <div className="text-[11px] text-gray-500">DME (g)</div>
                            <div className="font-semibold text-sm">
                              {res?.dmeGrams.toFixed(0) ?? "–"}
                            </div>
                          </div>

                          <div className="rounded-md border border-gray-300 bg-white px-3 py-2">
                            <div className="text-[11px] text-gray-500">End (B)</div>
                            <div className="font-semibold text-sm">
                              {res?.endBillion.toFixed(0) ?? "–"}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-red-600"
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
                      <div className="text-sm text-gray-800 flex justify-end gap-x-6">
                        <span>
                          <span className="text-gray-600">Final:</span>{" "}
                          <span className="font-semibold text-gray-900">
                            {starterResults.finalEndB.toFixed(0)} B
                          </span>
                        </span>
                        <span>
                          <span className="text-gray-600">Diff:</span>{" "}
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
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs hover:bg-gray-50"
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
      {isPickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Select Yeast</h3>
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
                placeholder="Search yeasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                autoFocus
              />
            </div>

            {/* Modal Body - Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6">
              {presetsLoading ? (
                <p className="text-gray-500">Loading presets...</p>
              ) : filteredGrouped.length === 0 ? (
                <p className="text-gray-500">No yeasts found</p>
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
                            onClick={() => handleSelectFromPreset(preset)}
                            className="w-full text-left px-4 py-2 rounded hover:bg-amber-50 transition-colors flex justify-between items-center"
                          >
                            <span className="font-medium">{preset.name}</span>
                            <span className="text-sm text-gray-600">
                              {preset.attenuationPercent}% attenuation
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
              {yeastPresetsGrouped.reduce(
                (sum, group) => sum + group.items.length,
                0
              )}{" "}
              yeast strains available
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
