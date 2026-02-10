/**
 * Starter Calculator Component
 *
 * Calculates yeast cell counts and starter requirements for pitching.
 * Supports multiple yeast types (liquid, dry, slurry) and multi-step starters.
 * Uses White and Braukaiser models for cell growth calculations.
 */

import { useMemo, useEffect, useState } from "react";
import type { YeastType, StarterStep, StarterInfo } from "../../domain/models/Recipe";
import { starterCalculationService } from "../../domain/services/StarterCalculationService";

interface StarterCalculatorProps {
  /** Current starter info from yeast (for hydration) */
  starterInfo?: StarterInfo;
  /** Batch volume in liters */
  batchVolumeL: number;
  /** Original gravity for cell requirement calculation */
  og: number;
  /** Whether the calculator is expanded */
  isOpen: boolean;
  /** Toggle open/closed state */
  onToggle: () => void;
  /** Callback when starter info changes */
  onStarterChange: (info: StarterInfo) => void;
}

export default function StarterCalculator({
  starterInfo,
  batchVolumeL,
  og,
  isOpen,
  onToggle,
  onStarterChange,
}: StarterCalculatorProps) {
  // Starter state
  const [yeastType, setYeastType] = useState<YeastType>("liquid-100");
  const [packs, setPacks] = useState<number>(1);
  const [mfgDate, setMfgDate] = useState<string>("");
  const [slurryLiters, setSlurryLiters] = useState<number>(0);
  const [slurryBillionPerMl, setSlurryBillionPerMl] = useState<number>(1);
  const [steps, setSteps] = useState<StarterStep[]>([]);

  // Hydrate state from starterInfo prop
  useEffect(() => {
    if (starterInfo) {
      setYeastType(starterInfo.yeastType);
      setPacks(starterInfo.packs);
      setMfgDate(starterInfo.mfgDate || "");
      setSlurryLiters(starterInfo.slurryLiters || 0);
      setSlurryBillionPerMl(starterInfo.slurryBillionPerMl || 1);
      setSteps(starterInfo.steps);
    }
  }, [starterInfo]);

  // Notify parent when starter info changes
  useEffect(() => {
    if (isOpen) {
      onStarterChange({
        yeastType,
        packs,
        mfgDate,
        slurryLiters,
        slurryBillionPerMl,
        steps,
      });
    }
  }, [yeastType, packs, mfgDate, slurryLiters, slurryBillionPerMl, steps, isOpen, onStarterChange]);

  // Calculate starter results
  const starterResults = useMemo(() => {
    return starterCalculationService.calculateStarter(
      batchVolumeL,
      og,
      yeastType,
      packs,
      mfgDate,
      slurryLiters,
      slurryBillionPerMl,
      steps
    );
  }, [batchVolumeL, og, yeastType, packs, mfgDate, slurryLiters, slurryBillionPerMl, steps]);

  const diffB = starterResults.cellsAvailableB - starterResults.requiredCellsB;
  const finalDiffB = starterResults.finalEndB - starterResults.requiredCellsB;

  // Summary text for collapsed state
  const summaryText = useMemo(() => {
    if (isOpen) return "";

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
  }, [isOpen, starterResults, steps, yeastType, packs, slurryLiters, slurryBillionPerMl, mfgDate]);

  const handleAddStep = () => {
    if (steps.length >= 3) return;
    setSteps((xs) => [
      ...xs,
      {
        id: crypto.randomUUID(),
        liters: 2,
        gravity: 1.036,
        model: { kind: "white", aeration: "shaking" },
      },
    ]);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps((xs) => xs.filter((x) => x.id !== stepId));
  };

  const handleUpdateStep = (stepId: string, updates: Partial<StarterStep>) => {
    setSteps((xs) =>
      xs.map((x) => (x.id === stepId ? { ...x, ...updates } : x))
    );
  };

  return (
    <div className="border border-[rgb(var(--border))] rounded-lg">
      <div className="flex items-center justify-between p-4 bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-3">
          <span className="font-medium">Pitch Rate & Starter</span>
          {!isOpen && summaryText && (
            <span className="text-xs font-medium">{summaryText}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs px-3 py-1.5 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--card))] transition-colors"
        >
          {isOpen ? "Hide Calculator" : "Show Calculator"}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Part 1: Cells */}
          <div className="rounded-lg border border-[rgb(var(--border))] p-4 space-y-3">
            <div className="text-sm font-semibold">Part 1: Cells</div>

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
                          handleUpdateStep(s.id, {
                            liters: Number(e.target.value),
                          })
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
                          handleUpdateStep(s.id, {
                            gravity: Number(e.target.value),
                          })
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
                          const newModel = v.startsWith("white-")
                            ? {
                                kind: "white" as const,
                                aeration: v.replace("white-", "") as
                                  | "none"
                                  | "shaking",
                              }
                            : { kind: "braukaiser" as const };
                          handleUpdateStep(s.id, { model: newModel });
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
                      aria-label={`Remove step ${i + 1}`}
                      className="p-2 hover:text-red-600"
                      onClick={() => handleRemoveStep(s.id)}
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
                  onClick={handleAddStep}
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
  );
}
