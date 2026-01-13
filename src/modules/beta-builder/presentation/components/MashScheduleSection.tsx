/**
 * Mash Schedule Section Component
 *
 * Displays the mash schedule with:
 * - Step list with inline editing
 * - Modal for adding/editing mash steps
 * - Quick generators for common schedules
 * - Total mash time and volume display
 */

import { useState } from "react";
import { useRecipeStore } from "../stores/recipeStore";
import { mashScheduleService } from "../../domain/services/MashScheduleService";
import MashStepModal from "./MashStepModal";
import type { MashStep } from "../../domain/models/Recipe";

export default function MashScheduleSection() {
  const {
    currentRecipe,
    addMashStep,
    updateMashStep,
    removeMashStep,
  } = useRecipeStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<MashStep | undefined>(undefined);

  if (!currentRecipe) return null;

  const totalGrainKg = currentRecipe.fermentables.reduce((sum, f) => sum + f.weightKg, 0);
  const grainAbsorption = currentRecipe.equipment.grainAbsorptionLPerKg;

  // Calculate total mash time
  const totalMashTime = mashScheduleService.calculateTotalMashTime(currentRecipe.mashSteps);

  // Calculate total infusion water
  const totalInfusionWater = mashScheduleService.calculateTotalInfusionWater(currentRecipe.mashSteps);

  // Calculate mash volume after all steps
  const finalMashVolume = mashScheduleService.calculateMashVolumeAtStep(
    currentRecipe.mashSteps,
    totalGrainKg,
    grainAbsorption
  );

  // Handle opening modal for new step
  const handleOpenAddModal = () => {
    setEditingStep(undefined);
    setIsModalOpen(true);
  };

  // Handle opening modal for editing step
  const handleOpenEditModal = (step: MashStep) => {
    setEditingStep(step);
    setIsModalOpen(true);
  };

  // Handle saving step from modal
  const handleSaveStep = (step: MashStep) => {
    if (editingStep) {
      // Update existing step
      updateMashStep(step.id, step);
    } else {
      // Add new step
      addMashStep(step);
    }
  };

  // Handle generating default schedules
  const handleGenerateSingleInfusion = () => {
    if (currentRecipe.mashSteps.length > 0) {
      if (!confirm("This will replace your current mash schedule. Continue?")) {
        return;
      }
      // Clear existing steps
      currentRecipe.mashSteps.forEach(step => removeMashStep(step.id));
    }

    const defaultStep = mashScheduleService.generateDefaultSingleInfusion(currentRecipe);
    addMashStep(defaultStep);
  };

  const handleGenerateMultiStep = () => {
    if (currentRecipe.mashSteps.length > 0) {
      if (!confirm("This will replace your current mash schedule. Continue?")) {
        return;
      }
      // Clear existing steps
      currentRecipe.mashSteps.forEach(step => removeMashStep(step.id));
    }

    const defaultSteps = mashScheduleService.generateDefaultMultiStep(currentRecipe);
    defaultSteps.forEach(step => addMashStep(step));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mash Schedule</h3>
          <p className="text-sm text-gray-600">
            Total Time: {totalMashTime} min | Water: {totalInfusionWater.toFixed(1)} L | Final Volume: {finalMashVolume.toFixed(1)} L
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSingleInfusion}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Single Infusion
          </button>
          <button
            onClick={handleGenerateMultiStep}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Multi-Step
          </button>
        </div>
      </div>

      {/* Mash Steps List */}
      {currentRecipe.mashSteps.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded">
          <p>No mash steps added yet.</p>
          <p className="text-sm">Use the buttons above to generate a default schedule, or add steps manually below.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentRecipe.mashSteps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Step Number */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-semibold">
                {index + 1}
              </div>

              {/* Step Details */}
              <div className="flex-1 grid grid-cols-5 gap-3 items-center">
                {/* Name & Type */}
                <div className="col-span-2">
                  <div className="font-semibold text-gray-900">{step.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{step.type}</div>
                </div>

                {/* Temperature */}
                <div>
                  <div className="text-xs text-gray-500">Target Temp</div>
                  <div className="font-semibold text-gray-900">{step.temperatureC}°C</div>
                </div>

                {/* Duration */}
                <div>
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="font-semibold text-gray-900">{step.durationMinutes} min</div>
                </div>

                {/* Infusion Info (for infusion steps) */}
                <div>
                  {step.type === "infusion" && step.infusionVolumeLiters && step.infusionTempC && (
                    <div>
                      <div className="text-xs text-gray-500">Infusion</div>
                      <div className="text-sm font-semibold text-blue-700">
                        {step.infusionVolumeLiters.toFixed(1)} L @ {step.infusionTempC.toFixed(1)}°C
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEditModal(step)}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeMashStep(step.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Step Button */}
      <button
        onClick={handleOpenAddModal}
        className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Add Mash Step
      </button>

      {/* Warning if no grains */}
      {totalGrainKg === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ⚠️ Add fermentables first to enable mash calculations
        </div>
      )}

      {/* Mash Step Modal */}
      <MashStepModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStep}
        recipe={currentRecipe}
        existingStep={editingStep}
      />
    </div>
  );
}
