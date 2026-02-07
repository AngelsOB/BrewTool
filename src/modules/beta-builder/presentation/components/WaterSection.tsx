/**
 * Water Section Component
 *
 * Shows:
 * 1. Calculated water volumes for brew day
 * 2. Water chemistry with salt additions
 * 3. Other ingredients (finings, spices, water agents, etc.)
 */

import { useMemo, useState } from "react";
import type { RecipeCalculations, OtherIngredient, OtherIngredientCategory } from "../../domain/models/Recipe";
import type { Recipe } from "../../domain/models/Recipe";
import { waterChemistryService, COMMON_WATER_PROFILES, BEER_STYLE_TARGETS, type WaterProfile, type SaltAdditions } from "../../domain/services/WaterChemistryService";
import { useRecipeStore } from "../stores/recipeStore";
import { OTHER_INGREDIENT_PRESETS } from "../../../../utils/presets";
import TargetStyleModal from "./TargetStyleModal";
import SourceWaterModal from "./SourceWaterModal";
import ModalOverlay from "./ModalOverlay";

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

const UNITS = ["g", "kg", "tsp", "tbsp", "oz", "lb", "ml", "l", "drops", "capsule", "tablet", "packet"];

const TIMINGS: OtherIngredient["timing"][] = ["mash", "boil", "whirlpool", "secondary", "kegging", "bottling"];

const CATEGORY_LABELS: Record<OtherIngredientCategory, string> = {
  "water-agent": "Water Agent",
  fining: "Fining",
  spice: "Spice",
  flavor: "Flavor",
  herb: "Herb",
  other: "Other",
};

const CATEGORY_COLORS: Record<OtherIngredientCategory, string> = {
  "water-agent": "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  fining: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
  spice: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  flavor: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  herb: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  other: "bg-gray-100 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300",
};

function getDefaultUnit(category: OtherIngredientCategory): string {
  switch (category) {
    case "water-agent": return "ml";
    case "fining": return "tablet";
    case "spice": return "g";
    case "flavor": return "g";
    case "herb": return "g";
    case "other": return "g";
  }
}

function getDefaultTiming(category: OtherIngredientCategory): OtherIngredient["timing"] {
  switch (category) {
    case "water-agent": return "mash";
    case "fining": return "boil";
    case "spice": return "boil";
    case "flavor": return "secondary";
    case "herb": return "boil";
    case "other": return "boil";
  }
}

export default function WaterSection({ calculations, recipe }: Props) {
  const { updateRecipe, addOtherIngredient, updateOtherIngredient, removeOtherIngredient } = useRecipeStore();
  const [isChemistryExpanded, setIsChemistryExpanded] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Other Ingredients state
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [isCustomIngredientModalOpen, setIsCustomIngredientModalOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<OtherIngredientCategory | "all">("all");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<OtherIngredientCategory>("other");

  // Initialize water chemistry if not present
  const waterChem = recipe.waterChemistry || {
    sourceProfile: COMMON_WATER_PROFILES.RO,
    saltAdditions: {},
    sourceProfileName: "RO",
    targetStyleName: "Balanced",
  };

  const otherIngredients = recipe.otherIngredients || [];

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

  // Filtered presets for the picker modal
  const filteredPresets = useMemo(() => {
    const categories = Object.entries(OTHER_INGREDIENT_PRESETS) as [OtherIngredientCategory, readonly string[]][];
    return categories
      .filter(([cat]) => activeCategory === "all" || cat === activeCategory)
      .map(([cat, items]) => ({
        category: cat as OtherIngredientCategory,
        label: CATEGORY_LABELS[cat as OtherIngredientCategory],
        items: items.filter((name) =>
          name.toLowerCase().includes(ingredientSearch.toLowerCase())
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [ingredientSearch, activeCategory]);

  const handleSourceProfileChange = (profile: WaterProfile, profileName: string) => {
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

  const handleAddFromPreset = (name: string, category: OtherIngredientCategory) => {
    addOtherIngredient({
      id: crypto.randomUUID(),
      name,
      category,
      amount: 1,
      unit: getDefaultUnit(category),
      timing: getDefaultTiming(category),
    });
    setIsIngredientPickerOpen(false);
    setIngredientSearch("");
    setActiveCategory("all");
  };

  const handleAddCustomIngredient = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    addOtherIngredient({
      id: crypto.randomUUID(),
      name: trimmed,
      category: customCategory,
      amount: 1,
      unit: getDefaultUnit(customCategory),
      timing: getDefaultTiming(customCategory),
    });
    setIsCustomIngredientModalOpen(false);
    setCustomName("");
    setCustomCategory("other");
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

      {/* Estimated Mash pH */}
      {calculations.estimatedMashPh != null && (() => {
        const ph = calculations.estimatedMashPh;
        const inRange = ph >= 5.2 && ph <= 5.6;
        const inIdeal = ph >= 5.2 && ph <= 5.4;
        const adj = calculations.mashPhAdjustment;
        return (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Estimated Mash pH
            </h3>
            <div className={`rounded-lg p-4 border ${
              inIdeal
                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                : inRange
                  ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
                  : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold ${
                    inIdeal
                      ? 'text-green-900 dark:text-green-100'
                      : inRange
                        ? 'text-yellow-900 dark:text-yellow-100'
                        : 'text-red-900 dark:text-red-100'
                  }`}>
                    {ph.toFixed(2)}
                  </div>
                  <div className={`text-xs mt-1 ${
                    inIdeal
                      ? 'text-green-600 dark:text-green-400'
                      : inRange
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {recipe.waterChemistry ? 'With water profile' : 'DI water estimate'}
                    {' '}&middot; Target: 5.2–5.6
                  </div>
                </div>
                {adj && adj.lacticAcid88Ml > 0 && (
                  <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-md text-right">
                    <div className="font-semibold">Add ~{adj.lacticAcid88Ml} mL lactic acid (88%)</div>
                    <div className="text-amber-600 dark:text-amber-400">to reach pH {adj.targetPh.toFixed(1)}</div>
                  </div>
                )}
                {adj && adj.bakingSodaG > 0 && (
                  <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-md text-right">
                    <div className="font-semibold">Add ~{adj.bakingSodaG} g baking soda</div>
                    <div className="text-amber-600 dark:text-amber-400">to reach pH {adj.targetPh.toFixed(1)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Water Chemistry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Water Chemistry
          </h3>

          {/* Final Water Metrics - Inline */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Final:
            </span>
            {ION_LABELS.map((ion) => {
              const finalValue = Math.round(finalProfile[ion]);
              return (
                <div key={ion} className="text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">{ion}:</span>
                  <span className="ml-1 font-bold text-gray-900 dark:text-gray-100">{finalValue}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsChemistryExpanded(!isChemistryExpanded)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            {isChemistryExpanded ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {/* Collapsed View - Salt Summary with Auto-Calculated Mash/Sparge Split */}
        {!isChemistryExpanded && (
          <div>
            {Object.values(waterChem.saltAdditions).some(v => v && v > 0) && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Added to {waterChem.sourceProfileName || "Custom"}:
              </div>
            )}
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
          </div>
        )}

        {/* Expanded View - Full Controls */}
        {isChemistryExpanded && (
          <>
            {/* Source and Target Profiles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Source Water</label>
                <button
                  onClick={() => setIsSourceModalOpen(true)}
                  className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-left hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors"
                >
                  {waterChem.sourceProfileName || "Custom"}
                </button>
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
                    // Within tolerance - calculate proximity to exact target
                    // Closer to exact = higher deviationPercent for darker green
                    const absoluteDiff = Math.abs(diff);
                    const percentOfTolerance = absoluteDiff / tolerance; // 0 = exact, 1 = at edge
                    deviationPercent = 1 - percentOfTolerance; // Invert: 1 = exact, 0 = at edge
                  }

                  // Map deviation to opacity
                  // For green: exact target (1.0) = 0.6 opacity, edge (0.0) = 0.15 opacity
                  // For red/orange: further from target = higher opacity
                  const opacity = baseColor === "green"
                    ? 0.15 + (deviationPercent * 0.45) // Scales from 0.15 to 0.6
                    : Math.max(0.15, Math.min(0.6, deviationPercent));

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

      {/* Other Ingredients */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Other Ingredients
          </h3>
          <button
            onClick={() => setIsIngredientPickerOpen(true)}
            className="text-sm px-3 py-1.5 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] transition-colors"
          >
            + Add
          </button>
        </div>

        {otherIngredients.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            No additional ingredients — finings, spices, water agents, etc.
          </div>
        ) : (
          <div className="space-y-2">
            {otherIngredients.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center gap-2 p-2.5 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
              >
                {/* Category badge */}
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                    CATEGORY_COLORS[ing.category] || CATEGORY_COLORS.other
                  }`}
                >
                  {CATEGORY_LABELS[ing.category] || "Other"}
                </span>

                {/* Name */}
                <span className="text-sm font-medium truncate min-w-0 flex-shrink">
                  {ing.name}
                </span>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Timing */}
                <select
                  value={ing.timing}
                  onChange={(e) =>
                    updateOtherIngredient(ing.id, {
                      timing: e.target.value as OtherIngredient["timing"],
                    })
                  }
                  className="text-xs px-1.5 py-1 rounded border border-[rgb(var(--border))] bg-white dark:bg-gray-800 shrink-0"
                >
                  {TIMINGS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Amount + Unit */}
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    value={ing.amount || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const isDiscrete = ["tablet", "packet", "capsule"].includes(ing.unit);
                      updateOtherIngredient(ing.id, {
                        amount: isDiscrete ? Math.round(val) : val,
                      });
                    }}
                    step={["tablet", "packet", "capsule"].includes(ing.unit) ? 1 : 0.1}
                    min="0"
                    placeholder="0"
                    className="w-16 text-xs px-1.5 py-1 rounded border border-[rgb(var(--border))] bg-white dark:bg-gray-800 text-right"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => {
                      const unit = e.target.value;
                      const isDiscrete = ["tablet", "packet", "capsule"].includes(unit);
                      updateOtherIngredient(ing.id, {
                        unit,
                        amount: isDiscrete ? Math.round(ing.amount || 0) : ing.amount,
                      });
                    }}
                    className="text-xs px-1 py-1 rounded border border-[rgb(var(--border))] bg-white dark:bg-gray-800"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeOtherIngredient(ing.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition shrink-0"
                  title="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="mt-4 text-xs bg-[rgb(var(--bg))] p-3 rounded border border-[rgb(var(--border))]">
        <strong>Note:</strong> Water volumes account for grain absorption, boil-off, hop
        absorption, deadspace, and all equipment losses.
      </div>

      {/* Source Water Modal */}
      <SourceWaterModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onSelect={handleSourceProfileChange}
        currentProfile={waterChem.sourceProfile}
        currentProfileName={waterChem.sourceProfileName}
      />

      {/* Target Style Modal */}
      <TargetStyleModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSelect={handleTargetStyleChange}
        currentStyleName={waterChem.targetStyleName}
      />

      {/* Other Ingredient Picker Modal */}
      <ModalOverlay
        isOpen={isIngredientPickerOpen}
        onClose={() => {
          setIsIngredientPickerOpen(false);
          setIngredientSearch("");
          setActiveCategory("all");
        }}
        size="lg"
      >
        <div className="p-4 border-b border-[rgb(var(--border))]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Add Ingredient</h3>
            <button
              onClick={() => {
                setIsIngredientPickerOpen(false);
                setIngredientSearch("");
                setActiveCategory("all");
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
            placeholder="Search ingredients..."
            autoFocus
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 mb-3"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                activeCategory === "all"
                  ? "bg-cyan-600 text-white border-cyan-600"
                  : "border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))]"
              }`}
            >
              All
            </button>
            {(Object.keys(CATEGORY_LABELS) as OtherIngredientCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-cyan-600 text-white border-cyan-600"
                    : "border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-2">
          {filteredPresets.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No ingredients match your search
            </div>
          ) : (
            filteredPresets.map((group) => (
              <div key={group.category} className="mb-2">
                <div className="sticky top-0 bg-[rgb(var(--card))] px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {group.label}
                </div>
                {group.items.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAddFromPreset(name, group.category)}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-[rgb(var(--bg))] transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[rgb(var(--border))] flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredPresets.reduce((sum, g) => sum + g.items.length, 0)} ingredients
          </span>
          <button
            onClick={() => {
              setIsIngredientPickerOpen(false);
              setIngredientSearch("");
              setActiveCategory("all");
              setCustomName("");
              setCustomCategory("other");
              setIsCustomIngredientModalOpen(true);
            }}
            className="text-sm px-3 py-1.5 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] transition-colors"
          >
            Add Custom
          </button>
        </div>
      </ModalOverlay>

      {/* Custom Ingredient Modal */}
      <ModalOverlay
        isOpen={isCustomIngredientModalOpen}
        onClose={() => {
          setIsCustomIngredientModalOpen(false);
          setCustomName("");
          setCustomCategory("other");
        }}
        size="sm"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Custom Ingredient</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">
                Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ingredient name"
                autoFocus
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustomIngredient();
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">
                Category
              </label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as OtherIngredientCategory)}
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
              >
                {(Object.keys(CATEGORY_LABELS) as OtherIngredientCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setIsCustomIngredientModalOpen(false);
                  setCustomName("");
                  setCustomCategory("other");
                }}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomIngredient}
                disabled={!customName.trim()}
                className="flex-1 px-3 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
}
