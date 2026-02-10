/**
 * Water Section Component
 *
 * Shows:
 * 1. Calculated water volumes for brew day
 * 2. Water chemistry with salt additions
 * 3. Other ingredients (finings, spices, water agents, etc.)
 */

import { useMemo, useState } from "react";
import type { RecipeCalculations, OtherIngredientCategory } from "../../domain/models/Recipe";
import type { Recipe } from "../../domain/models/Recipe";
import {
  waterChemistryService,
  COMMON_WATER_PROFILES,
  BEER_STYLE_TARGETS,
  type WaterProfile,
  type SaltAdditions,
} from "../../domain/services/WaterChemistryService";
import { useRecipeStore } from "../stores/recipeStore";
import TargetStyleModal from "./TargetStyleModal";
import SourceWaterModal from "./SourceWaterModal";
import {
  WaterVolumesDisplay,
  PhAdjustmentsSection,
  WaterChemistrySection,
  OtherIngredientsPanel,
  WaterIngredientPickerModal,
  CustomWaterIngredientModal,
  getDefaultUnit,
  getDefaultTiming,
} from "./water-section";

type Props = {
  calculations: RecipeCalculations | null;
  recipe: Recipe;
};

export default function WaterSection({ calculations, recipe }: Props) {
  const { updateRecipe, addOtherIngredient, updateOtherIngredient, removeOtherIngredient } =
    useRecipeStore();
  const [isChemistryExpanded, setIsChemistryExpanded] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isIngredientPickerOpen, setIsIngredientPickerOpen] = useState(false);
  const [isCustomIngredientModalOpen, setIsCustomIngredientModalOpen] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to water chemistry changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to water chemistry changes
  }, [waterChem.saltAdditions, calculations?.mashWaterL, calculations?.spargeWaterL]);

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
  };

  const handleAddCustomIngredient = (name: string, category: OtherIngredientCategory) => {
    addOtherIngredient({
      id: crypto.randomUUID(),
      name,
      category,
      amount: 1,
      unit: getDefaultUnit(category),
      timing: getDefaultTiming(category),
    });
  };

  const handleAddPhAdjustment = (name: string, amount: number, unit: string) => {
    // Check if this ingredient already exists in otherIngredients (match by name, case-insensitive)
    const existing = otherIngredients.find(
      (ing) => ing.name.toLowerCase() === name.toLowerCase() && ing.timing === "mash"
    );

    if (existing) {
      // Update the existing ingredient's amount
      updateOtherIngredient(existing.id, { amount });
    } else {
      // Add as a new water-agent ingredient
      addOtherIngredient({
        id: crypto.randomUUID(),
        name,
        category: "water-agent",
        amount,
        unit,
        timing: "mash",
      });
    }
  };

  if (!calculations) {
    return null;
  }

  // Get target profile for comparison
  const targetStyle = BEER_STYLE_TARGETS[waterChem.targetStyleName || "Balanced"];

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 border-t-4 border-cyan-500">
      <h2 className="text-xl font-semibold mb-4">Water</h2>

      {/* Water Volumes */}
      <WaterVolumesDisplay calculations={calculations} />

      {/* Estimated Mash pH */}
      <PhAdjustmentsSection
        calculations={calculations}
        hasWaterChemistry={!!recipe.waterChemistry}
        onAddPhAdjustment={handleAddPhAdjustment}
      />

      {/* Water Chemistry */}
      <WaterChemistrySection
        isExpanded={isChemistryExpanded}
        onToggleExpanded={() => setIsChemistryExpanded(!isChemistryExpanded)}
        sourceProfile={waterChem.sourceProfile}
        sourceProfileName={waterChem.sourceProfileName}
        targetStyle={targetStyle}
        targetStyleName={waterChem.targetStyleName}
        finalProfile={finalProfile}
        saltAdditions={waterChem.saltAdditions}
        mashSalts={mashSalts}
        spargeSalts={spargeSalts}
        onOpenSourceModal={() => setIsSourceModalOpen(true)}
        onOpenTargetModal={() => setIsTargetModalOpen(true)}
        onSaltChange={handleSaltChange}
      />

      {/* Other Ingredients */}
      <OtherIngredientsPanel
        ingredients={otherIngredients}
        onOpenPicker={() => setIsIngredientPickerOpen(true)}
        onUpdate={updateOtherIngredient}
        onRemove={removeOtherIngredient}
      />

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
      <WaterIngredientPickerModal
        isOpen={isIngredientPickerOpen}
        onClose={() => setIsIngredientPickerOpen(false)}
        onSelect={handleAddFromPreset}
        onOpenCustomModal={() => setIsCustomIngredientModalOpen(true)}
      />

      {/* Custom Ingredient Modal */}
      <CustomWaterIngredientModal
        isOpen={isCustomIngredientModalOpen}
        onClose={() => setIsCustomIngredientModalOpen(false)}
        onAdd={handleAddCustomIngredient}
      />
    </div>
  );
}
