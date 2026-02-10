/**
 * Equipment Section Component
 *
 * Displays equipment settings with profile selection.
 * All values are directly editable.
 */

import React, { useState, useEffect } from 'react';
import { useRecipeStore } from '../stores/recipeStore';
import { useEquipmentStore } from '../stores/equipmentStore';
import type { EquipmentProfile } from '../../domain/models/Equipment';
import { EquipmentProfileModal } from './EquipmentProfileModal';
import { CustomEquipmentModal } from './CustomEquipmentModal';

export const EquipmentSection: React.FC = () => {
  const recipe = useRecipeStore((state) => state.currentRecipe);
  const updateRecipe = useRecipeStore((state) => state.updateRecipe);
  const { profiles, loadProfiles, saveCustomProfile } = useEquipmentStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Load equipment profiles on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  if (!recipe) return null;

  // Find the current profile by name
  const currentProfile = recipe.equipmentProfileName
    ? profiles.find(p => p.name === recipe.equipmentProfileName)
    : null;

  // Check if current values differ from the selected profile
  const hasUnsavedChanges = currentProfile && (
    recipe.batchVolumeL !== currentProfile.batchSizeL ||
    recipe.equipment.boilTimeMin !== currentProfile.boilTimeMin ||
    recipe.equipment.boilOffRateLPerHour !== currentProfile.boilOffRateL_hr ||
    recipe.equipment.mashEfficiencyPercent !== currentProfile.mashEfficiency ||
    recipe.equipment.grainAbsorptionLPerKg !== currentProfile.grainAbsorptionL_kg ||
    recipe.equipment.mashTunDeadspaceLiters !== currentProfile.mashTunDeadspaceL ||
    recipe.equipment.kettleLossLiters !== currentProfile.kettleDeadspaceL ||
    recipe.equipment.fermenterLossLiters !== currentProfile.fermenterLossL ||
    Math.abs(recipe.equipment.hopsAbsorptionLPerKg - currentProfile.hopAbsorptionL_g * 1000) > 0.01
  );

  const handleSelectProfile = (profile: EquipmentProfile) => {
    // Apply the profile to the recipe
    updateRecipe({
      equipmentProfileName: profile.name,
      batchVolumeL: profile.batchSizeL,
      equipment: {
        ...recipe.equipment,
        boilTimeMin: profile.boilTimeMin,
        boilOffRateLPerHour: profile.boilOffRateL_hr,
        mashEfficiencyPercent: profile.mashEfficiency,
        grainAbsorptionLPerKg: profile.grainAbsorptionL_kg,
        mashTunDeadspaceLiters: profile.mashTunDeadspaceL,
        kettleLossLiters: profile.kettleDeadspaceL,
        fermenterLossLiters: profile.fermenterLossL,
        hopsAbsorptionLPerKg: profile.hopAbsorptionL_g * 1000, // Convert from L/g to L/kg
      },
    });
    setIsPickerOpen(false);
  };

  const handleSaveCustomProfile = async (profile: EquipmentProfile) => {
    await saveCustomProfile(profile);
    // Update recipe to reference the new profile
    updateRecipe({
      equipmentProfileName: profile.name,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Equipment & Volumes
        </h2>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="px-3 py-1.5 text-sm border-2 border-orange-600 text-orange-600 dark:border-orange-500 dark:text-orange-500 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              💾 Save as Custom
            </button>
          )}
          <button
            onClick={() => setIsPickerOpen(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {currentProfile ? `📋 ${currentProfile.name}` : 'Select Profile'}
          </button>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Batch Volume (L)
          </label>
          <input
            type="number"
            value={recipe.batchVolumeL}
            onChange={(e) =>
              updateRecipe({ batchVolumeL: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Mash Efficiency (%)
          </label>
          <input
            type="number"
            value={recipe.equipment.mashEfficiencyPercent}
            onChange={(e) =>
              updateRecipe({
                equipment: {
                  ...recipe.equipment,
                  mashEfficiencyPercent: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            step="1"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Boil Time (min)
          </label>
          <input
            type="number"
            value={recipe.equipment.boilTimeMin}
            onChange={(e) =>
              updateRecipe({
                equipment: {
                  ...recipe.equipment,
                  boilTimeMin: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            step="1"
          />
        </div>
      </div>

      {/* Advanced Settings - Collapsible */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4">
          Advanced Equipment Settings
        </summary>

        <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
          <div>
            <label className="block text-xs font-semibold mb-2">
              Boil-Off Rate (L/hr)
            </label>
            <input
              type="number"
              value={recipe.equipment.boilOffRateLPerHour}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    boilOffRateLPerHour: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Mash Thickness (L/kg)
            </label>
            <input
              type="number"
              value={recipe.equipment.mashThicknessLPerKg}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    mashThicknessLPerKg: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Grain Absorption (L/kg)
            </label>
            <input
              type="number"
              value={recipe.equipment.grainAbsorptionLPerKg}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    grainAbsorptionLPerKg: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Mash Tun Deadspace (L)
            </label>
            <input
              type="number"
              value={recipe.equipment.mashTunDeadspaceLiters}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    mashTunDeadspaceLiters: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Kettle Loss (L)
            </label>
            <input
              type="number"
              value={recipe.equipment.kettleLossLiters}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    kettleLossLiters: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Hop Absorption (L/kg)
            </label>
            <input
              type="number"
              value={recipe.equipment.hopsAbsorptionLPerKg}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    hopsAbsorptionLPerKg: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Chiller Loss (L)
            </label>
            <input
              type="number"
              value={recipe.equipment.chillerLossLiters}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    chillerLossLiters: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Fermenter Loss (L)
            </label>
            <input
              type="number"
              value={recipe.equipment.fermenterLossLiters}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    fermenterLossLiters: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">
              Cooling Shrinkage (%)
            </label>
            <input
              type="number"
              value={recipe.equipment.coolingShrinkagePercent}
              onChange={(e) =>
                updateRecipe({
                  equipment: {
                    ...recipe.equipment,
                    coolingShrinkagePercent: parseFloat(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              step="0.1"
            />
          </div>
        </div>
      </details>

      {/* Equipment Profile Picker Modal */}
      <EquipmentProfileModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectProfile}
        onCreateCustom={() => {
          setIsPickerOpen(false);
          setIsCustomModalOpen(true);
        }}
      />

      {/* Custom Equipment Modal */}
      <CustomEquipmentModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomProfile}
        currentSettings={{
          batchVolumeL: recipe.batchVolumeL,
          boilTimeMin: recipe.equipment.boilTimeMin,
          boilOffRateLPerHour: recipe.equipment.boilOffRateLPerHour,
          mashEfficiencyPercent: recipe.equipment.mashEfficiencyPercent,
          grainAbsorptionLPerKg: recipe.equipment.grainAbsorptionLPerKg,
          mashTunDeadspaceLiters: recipe.equipment.mashTunDeadspaceLiters,
          kettleLossLiters: recipe.equipment.kettleLossLiters,
          fermenterLossLiters: recipe.equipment.fermenterLossLiters,
          hopsAbsorptionLPerKg: recipe.equipment.hopsAbsorptionLPerKg,
        }}
      />
    </div>
  );
};
