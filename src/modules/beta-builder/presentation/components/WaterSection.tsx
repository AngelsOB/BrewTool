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
import { waterChemistryService, COMMON_WATER_PROFILES, type WaterProfile, type SaltAdditions } from "../../domain/services/WaterChemistryService";
import { useRecipeStore } from "../stores/recipeStore";

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

const ION_LABELS: Array<keyof WaterProfile> = ["Ca", "Mg", "Na", "Cl", "SO4", "HCO3"];

export default function WaterSection({ calculations, recipe }: Props) {
  const { updateRecipe } = useRecipeStore();
  const [showChemistry, setShowChemistry] = useState(false);

  // Initialize water chemistry if not present
  const waterChem = recipe.waterChemistry || {
    sourceProfile: COMMON_WATER_PROFILES.RO,
    saltAdditions: {},
    sourceProfileName: "RO",
  };

  // Calculate final water profile
  const finalProfile = useMemo(() => {
    if (!calculations) return waterChem.sourceProfile;
    return waterChemistryService.calculateFinalProfile(
      waterChem.sourceProfile,
      waterChem.saltAdditions,
      calculations.totalWaterL
    );
  }, [waterChem.sourceProfile, waterChem.saltAdditions, calculations?.totalWaterL]);

  const clToSo4Ratio = waterChemistryService.chlorideToSulfateRatio(finalProfile);

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

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Water</h2>

      {/* Water Volumes */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
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

      {/* Water Chemistry Toggle */}
      <button
        onClick={() => setShowChemistry(!showChemistry)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[rgb(var(--bg))] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-[rgb(var(--border))] transition-colors mb-4"
      >
        <span className="text-sm font-semibold">Water Chemistry</span>
        <svg
          className={`w-5 h-5 transition-transform ${showChemistry ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Water Chemistry Content */}
      {showChemistry && (
        <div className="space-y-4 p-4 bg-[rgb(var(--bg))] rounded-lg border border-[rgb(var(--border))]">
          {/* Source Water Profile */}
          <div>
            <label className="block text-sm font-semibold mb-2">Source Water Profile</label>
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

          {/* Salt Additions */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Salt Additions (grams)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(SALT_LABELS) as Array<keyof SaltAdditions>).map((saltKey) => (
                <div key={saltKey}>
                  <label className="block text-xs mb-1">{SALT_LABELS[saltKey]}</label>
                  <input
                    type="number"
                    value={waterChem.saltAdditions[saltKey] || ""}
                    onChange={(e) =>
                      handleSaltChange(saltKey, parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Final Water Profile */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Final Water Profile (ppm)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {ION_LABELS.map((ion) => (
                <div
                  key={ion}
                  className="bg-white dark:bg-gray-800 rounded p-2 border border-[rgb(var(--border))]"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">{ion}</div>
                  <div className="text-lg font-bold">{Math.round(finalProfile[ion])}</div>
                </div>
              ))}
            </div>

            {/* Cl:SO4 Ratio */}
            {clToSo4Ratio !== null && (
              <div className="mt-3 text-sm">
                <span className="font-semibold">Cl:SO₄ Ratio: </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {clToSo4Ratio.toFixed(2)}:1
                  <span className="ml-2 text-xs text-gray-500">
                    {clToSo4Ratio > 2
                      ? "(Malty/Soft)"
                      : clToSo4Ratio < 0.5
                      ? "(Hoppy/Dry)"
                      : "(Balanced)"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="mt-4 text-xs bg-[rgb(var(--bg))] p-3 rounded border border-[rgb(var(--border))]">
        <strong>Note:</strong> Water volumes account for grain absorption, boil-off, hop
        absorption, deadspace, and all equipment losses.
      </div>
    </div>
  );
}
