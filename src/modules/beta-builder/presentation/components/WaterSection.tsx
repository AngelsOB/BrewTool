/**
 * Water Section Component
 *
 * Shows:
 * 1. Calculated water volumes for brew day
 * 2. Water chemistry with salt additions
 */

import { useMemo, useState } from "react";
import type { RecipeCalculations } from "../../domain/models/Recipe";
import type { Recipe } from "../../domain/models/Recipe";
import { waterChemistryService, COMMON_WATER_PROFILES, BEER_STYLE_TARGETS, type WaterProfile, type SaltAdditions } from "../../domain/services/WaterChemistryService";
import { useRecipeStore } from "../stores/recipeStore";
import TargetStyleModal from "./TargetStyleModal";

type Props = {
  calculations: RecipeCalculations | null;
  recipe: Recipe;
};

const SALT_LABELS: Record<keyof SaltAdditions, string> = {
  gypsum_g: "Gypsum (CaSO₄)",
  cacl2_g: "Calcium Chloride (CaCl₂)",
  epsom_g: "Epsom Salt (MgSO₄)",
  nacl_g: "Table Salt (NaCl)",
  nahco3_g: "Baking Soda (NaHCO₃)",
};

const SALT_SHORT_LABELS: Record<keyof SaltAdditions, string> = {
  gypsum_g: "Gypsum",
  cacl2_g: "CaCl₂",
  epsom_g: "Epsom",
  nacl_g: "NaCl",
  nahco3_g: "Baking Soda",
};

const ION_LABELS: Array<keyof WaterProfile> = ["Ca", "Mg", "Na", "Cl", "SO4", "HCO3"];

export default function WaterSection({ calculations, recipe }: Props) {
  const { updateRecipe } = useRecipeStore();
  const [isChemistryExpanded, setIsChemistryExpanded] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Initialize water chemistry if not present
  const waterChem = recipe.waterChemistry || {
    sourceProfile: COMMON_WATER_PROFILES.RO,
    saltAdditions: {},
    sourceProfileName: "RO",
    targetStyleName: "Balanced",
  };

  // Calculate final water profile from total salts
  const finalProfile = useMemo(() => {
    if (!calculations) return waterChem.sourceProfile;
    return waterChemistryService.calculateFinalProfileFromTotalSalts(
      waterChem.sourceProfile,
      waterChem.saltAdditions,
      calculations.mashWaterL,
      calculations.spargeWaterL
    );
  }, [
    waterChem.sourceProfile,
    waterChem.saltAdditions,
    calculations?.mashWaterL,
    calculations?.spargeWaterL,
  ]);

  // Calculate mash and sparge split for display
  const { mashSalts, spargeSalts } = useMemo(() => {
    if (!calculations) return { mashSalts: {}, spargeSalts: {} };
    return waterChemistryService.splitSaltsProportionally(
      waterChem.saltAdditions,
      calculations.mashWaterL,
      calculations.spargeWaterL
    );
  }, [waterChem.saltAdditions, calculations?.mashWaterL, calculations?.spargeWaterL]);

  const handleSourceProfileChange = (profileName: string) => {
    const profile = COMMON_WATER_PROFILES[profileName];
    if (!profile) return;

    updateRecipe({
      waterChemistry: {
        ...waterChem,
        sourceProfile: profile,
        sourceProfileName: profileName,
      },
    });
  };

  const handleTargetStyleChange = (styleName: string) => {
    updateRecipe({
      waterChemistry: {
        ...waterChem,
        targetStyleName: styleName,
      },
    });
  };

  const handleSaltChange = (saltKey: keyof SaltAdditions, value: number) => {
    updateRecipe({
      waterChemistry: {
        ...waterChem,
        saltAdditions: {
          ...waterChem.saltAdditions,
          [saltKey]: value || undefined,
        },
      },
    });
  };

  if (!calculations) {
    return null;
  }

  // Get target profile for comparison
  const targetStyle = BEER_STYLE_TARGETS[waterChem.targetStyleName || "Balanced"];
  const targetProfile = targetStyle?.profile || BEER_STYLE_TARGETS["Balanced"].profile;

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 border-t-4 border-cyan-500">
      <h2 className="text-xl font-semibold mb-4">Water</h2>

      {/* Water Volumes */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Volumes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Mash Water */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300 mb-1 font-medium">
              Mash Water
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {calculations.mashWaterL.toFixed(1)}
              <span className="text-lg ml-1">L</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Strike water
            </div>
          </div>

          {/* Sparge Water */}
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-300 mb-1 font-medium">
              Sparge Water
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {calculations.spargeWaterL.toFixed(1)}
              <span className="text-lg ml-1">L</span>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              For sparging
            </div>
          </div>

          {/* Pre-Boil Volume */}
          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <div className="text-sm text-amber-700 dark:text-amber-300 mb-1 font-medium">
              Pre-Boil
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {calculations.preBoilVolumeL.toFixed(1)}
              <span className="text-lg ml-1">L</span>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              In kettle
            </div>
          </div>

          {/* Total Water */}
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-purple-700 dark:text-purple-300 mb-1 font-medium">
              Total Water
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {calculations.totalWaterL.toFixed(1)}
              <span className="text-lg ml-1">L</span>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Grand total
            </div>
          </div>
        </div>
      </div>

      {/* Water Chemistry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Water Chemistry
          </h3>
          <button
            onClick={() => setIsChemistryExpanded(!isChemistryExpanded)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isChemistryExpanded ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {/* Collapsed View - Salt Summary with Auto-Calculated Mash/Sparge Split */}
        {!isChemistryExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.keys(SALT_SHORT_LABELS) as Array<keyof SaltAdditions>).map((saltKey) => {
              const totalAmount = waterChem.saltAdditions[saltKey] || 0;
              const mashAmount = mashSalts[saltKey] || 0;
              const spargeAmount = spargeSalts[saltKey] || 0;

              if (totalAmount === 0) return null;

              return (
                <div
                  key={saltKey}
                  className="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800"
                >
                  <div className="text-xs text-cyan-700 dark:text-cyan-300 mb-1 font-medium">
                    {SALT_SHORT_LABELS[saltKey]}
                  </div>
                  <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                    {totalAmount.toFixed(1)}
                    <span className="text-sm ml-1">g total</span>
                  </div>
                  <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1 space-y-0.5">
                    <div>Mash: {mashAmount.toFixed(1)}g</div>
                    <div>Sparge: {spargeAmount.toFixed(1)}g</div>
                  </div>
                </div>
              );
            })}
            {Object.values(waterChem.saltAdditions).every(v => !v || v === 0) && (
              <div className="col-span-full text-sm text-gray-500 dark:text-gray-400 italic">
                No salts added yet
              </div>
            )}
          </div>
        )}

        {/* Expanded View - Full Controls */}
        {isChemistryExpanded && (
          <>
            {/* Source and Target Profiles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Source Water</label>
                <select
                  value={waterChem.sourceProfileName || "RO"}
                  onChange={(e) => handleSourceProfileChange(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
                >
                  {Object.keys(COMMON_WATER_PROFILES).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Target Style</label>
                <button
                  onClick={() => setIsTargetModalOpen(true)}
                  className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-left hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors"
                >
                  {waterChem.targetStyleName || "Balanced"}
                </button>
                {targetStyle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {targetStyle.clToSo4Ratio}
                  </p>
                )}
              </div>
            </div>

            {/* Salt Additions */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Salt Additions (grams total)</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Enter total amounts - they'll be automatically split between mash and sparge water
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(SALT_LABELS) as Array<keyof SaltAdditions>).map((saltKey) => {
                  const totalAmount = waterChem.saltAdditions[saltKey] || 0;
                  const mashAmount = mashSalts[saltKey] || 0;
                  const spargeAmount = spargeSalts[saltKey] || 0;

                  return (
                    <div key={saltKey}>
                      <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">
                        {SALT_LABELS[saltKey]}
                      </label>
                      <input
                        type="number"
                        value={totalAmount || ""}
                        onChange={(e) =>
                          handleSaltChange(saltKey, parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
                      />
                      {totalAmount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Mash: {mashAmount.toFixed(1)}g / Sparge: {spargeAmount.toFixed(1)}g
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

        {/* Water Profile Comparison */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Water Profile Comparison (ppm)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))]">
                  <th className="text-left py-2 px-3 font-semibold">Ion</th>
                  <th className="text-right py-2 px-3 font-semibold">Source</th>
                  <th className="text-right py-2 px-3 font-semibold">Target</th>
                  <th className="text-right py-2 px-3 font-semibold">
                    Final
                  </th>
                </tr>
              </thead>
              <tbody>
                {ION_LABELS.map((ion) => {
                  const finalValue = Math.round(finalProfile[ion]);
                  const targetValue = Math.round(targetProfile[ion]);

                  // Calculate difference from target and create opacity-based gradient
                  const diff = finalValue - targetValue;
                  const tolerance = targetValue * 0.2;

                  // Calculate how far off we are as a percentage (0 = on target, 1 = very far)
                  let deviationPercent = 0;
                  let baseColor = "green"; // Default to green

                  if (diff < -tolerance) {
                    // Too low - red
                    baseColor = "red";
                    deviationPercent = Math.min(Math.abs(diff) / (targetValue || 1), 1);
                  } else if (diff > tolerance) {
                    // Too high - orange
                    baseColor = "orange";
                    deviationPercent = Math.min(diff / (targetValue || 1), 1);
                  } else {
                    // Within tolerance - green (low opacity)
                    deviationPercent = 0.2; // Always show a bit of green
                  }

                  // Map deviation to opacity: closer to target = lower opacity (more transparent/greener)
                  // Further from target = higher opacity (more red/orange)
                  const opacity = baseColor === "green" ? 0.15 : Math.max(0.15, Math.min(0.6, deviationPercent));

                  const bgStyle = {
                    backgroundColor:
                      baseColor === "green"
                        ? `rgba(34, 197, 94, ${opacity})` // green-500
                        : baseColor === "red"
                        ? `rgba(239, 68, 68, ${opacity})` // red-500
                        : `rgba(249, 115, 22, ${opacity})`, // orange-500
                  };

                  return (
                    <tr key={ion} className="border-b border-[rgb(var(--border))]">
                      <td className="py-2 px-3 font-medium">{ion}</td>
                      <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                        {Math.round(waterChem.sourceProfile[ion])}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                        {targetValue}
                      </td>
                      <td className="text-right py-2 px-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded font-bold"
                          style={bgStyle}
                        >
                          {finalValue}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Info note */}
      <div className="mt-4 text-xs bg-[rgb(var(--bg))] p-3 rounded border border-[rgb(var(--border))]">
        <strong>Note:</strong> Water volumes account for grain absorption, boil-off, hop
        absorption, deadspace, and all equipment losses.
      </div>

      {/* Target Style Modal */}
      <TargetStyleModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSelect={handleTargetStyleChange}
        currentStyleName={waterChem.targetStyleName}
      />
    </div>
  );
}
