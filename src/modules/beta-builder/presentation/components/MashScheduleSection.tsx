/**
 * Mash Schedule Section Component
 *
 * Displays the mash schedule with:
 * - Step editor for adding/removing/editing mash steps
 * - Step type selector (infusion, temperature, decoction)
 * - Temperature and timing controls
 * - Strike/infusion temperature calculator
 * - Total mash time and volume display
 */

import { useState } from "react";
import { useRecipeStore } from "../stores/recipeStore";
import { mashScheduleService } from "../../domain/services/MashScheduleService";
import type { MashStep, MashStepType } from "../../domain/models/Recipe";

export default function MashScheduleSection() {
  const {
    currentRecipe,
    addMashStep,
    updateMashStep,
    removeMashStep,
    reorderMashSteps,
  } = useRecipeStore();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddStep, setShowAddStep] = useState(false);

  // New step form state
  const [newStepName, setNewStepName] = useState("");
  const [newStepType, setNewStepType] = useState<MashStepType>("infusion");
  const [newStepTemp, setNewStepTemp] = useState(66);
  const [newStepDuration, setNewStepDuration] = useState(60);
  const [newStepInfusionVolume, setNewStepInfusionVolume] = useState<number | null>(null);

  if (!currentRecipe) return null;

  const totalGrainKg = currentRecipe.fermentables.reduce((sum, f) => sum + f.weightKg, 0);
  const mashThickness = currentRecipe.equipment.mashThicknessLPerKg;
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

  // Handle adding a new step
  const handleAddStep = () => {
    if (!newStepName.trim()) {
      alert("Please enter a step name");
      return;
    }

    // Calculate infusion volume and temperature for infusion steps
    let infusionVolume: number | undefined;
    let infusionTemp: number | undefined;

    if (newStepType === "infusion") {
      // Use provided volume or calculate default
      infusionVolume = newStepInfusionVolume ?? totalGrainKg * mashThickness;

      // Calculate strike/infusion temp
      if (currentRecipe.mashSteps.length === 0) {
        // First step = strike water
        infusionTemp = mashScheduleService.calculateStrikeTemp(
          newStepTemp,
          mashThickness,
          20,
          totalGrainKg
        );
      } else {
        // Subsequent infusion = calculate infusion temp
        const currentVolume = mashScheduleService.calculateMashVolumeAtStep(
          currentRecipe.mashSteps,
          totalGrainKg,
          grainAbsorption
        );
        // Assume current mash is at the last step's temperature
        const lastStep = currentRecipe.mashSteps[currentRecipe.mashSteps.length - 1];
        const currentTemp = lastStep?.temperatureC ?? 20;

        infusionTemp = mashScheduleService.calculateInfusionTemp(
          currentTemp,
          newStepTemp,
          currentVolume,
          infusionVolume,
          totalGrainKg
        );
      }
    }

    const newStep: MashStep = {
      id: crypto.randomUUID(),
      name: newStepName.trim(),
      type: newStepType,
      temperatureC: newStepTemp,
      durationMinutes: newStepDuration,
      infusionVolumeLiters: infusionVolume,
      infusionTempC: infusionTemp,
    };

    // Validate step
    const errors = mashScheduleService.validateMashStep(newStep);
    if (errors.length > 0) {
      alert("Validation errors:\n" + errors.join("\n"));
      return;
    }

    addMashStep(newStep);

    // Reset form
    setNewStepName("");
    setNewStepType("infusion");
    setNewStepTemp(66);
    setNewStepDuration(60);
    setNewStepInfusionVolume(null);
    setShowAddStep(false);
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

  // Handle inline editing
  const handleStepChange = (stepId: string, field: keyof MashStep, value: any) => {
    updateMashStep(stepId, { [field]: value });
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
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded shadow-sm"
            >
              {/* Step Number */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-semibold">
                {index + 1}
              </div>

              {/* Step Details */}
              <div className="flex-1 grid grid-cols-6 gap-3 items-center">
                {/* Name */}
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => handleStepChange(step.id, "name", e.target.value)}
                  className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Step name"
                />

                {/* Type */}
                <select
                  value={step.type}
                  onChange={(e) => handleStepChange(step.id, "type", e.target.value as MashStepType)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="infusion">Infusion</option>
                  <option value="temperature">Temperature</option>
                  <option value="decoction">Decoction</option>
                </select>

                {/* Temperature */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={step.temperatureC}
                    onChange={(e) => handleStepChange(step.id, "temperatureC", parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    step="0.5"
                  />
                  <span className="text-xs text-gray-500">°C</span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={step.durationMinutes}
                    onChange={(e) => handleStepChange(step.id, "durationMinutes", parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>

                {/* Infusion Info (for infusion steps) */}
                {step.type === "infusion" && (
                  <div className="col-span-1 text-xs text-gray-600">
                    {step.infusionVolumeLiters?.toFixed(1)} L @ {step.infusionTempC?.toFixed(1)}°C
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeMashStep(step.id)}
                className="flex-shrink-0 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Step Form */}
      {!showAddStep ? (
        <button
          onClick={() => setShowAddStep(true)}
          className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Add Mash Step
        </button>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded space-y-3">
          <h4 className="font-semibold text-sm">Add New Mash Step</h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Step Name */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Step Name</label>
              <input
                type="text"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., Saccharification"
              />
            </div>

            {/* Step Type */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select
                value={newStepType}
                onChange={(e) => setNewStepType(e.target.value as MashStepType)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="infusion">Infusion (add water)</option>
                <option value="temperature">Temperature (rest)</option>
                <option value="decoction">Decoction</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Temperature (°C)</label>
              <input
                type="number"
                value={newStepTemp}
                onChange={(e) => setNewStepTemp(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                step="0.5"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={newStepDuration}
                onChange={(e) => setNewStepDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            {/* Infusion Volume (for infusion steps) */}
            {newStepType === "infusion" && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Infusion Volume (L)
                  <span className="text-gray-400 ml-1">(optional, auto-calculated)</span>
                </label>
                <input
                  type="number"
                  value={newStepInfusionVolume ?? ""}
                  onChange={(e) => setNewStepInfusionVolume(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder={`Auto: ${(totalGrainKg * mashThickness).toFixed(1)} L`}
                  step="0.1"
                />
              </div>
            )}
          </div>

          {/* Info box for calculated values */}
          {newStepType === "infusion" && totalGrainKg > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="font-semibold text-blue-900">Calculated Infusion:</p>
              <p className="text-blue-700">
                {currentRecipe.mashSteps.length === 0
                  ? `Strike water: ${mashScheduleService.calculateStrikeTemp(
                      newStepTemp,
                      mashThickness,
                      20,
                      totalGrainKg
                    ).toFixed(1)}°C`
                  : "Infusion temp will be calculated based on current mash temperature"}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddStep}
              className="flex-1 px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Step
            </button>
            <button
              onClick={() => {
                setShowAddStep(false);
                setNewStepName("");
                setNewStepType("infusion");
                setNewStepTemp(66);
                setNewStepDuration(60);
                setNewStepInfusionVolume(null);
              }}
              className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      {totalGrainKg === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ⚠️ Add fermentables first to enable mash calculations
        </div>
      )}
    </div>
  );
}
