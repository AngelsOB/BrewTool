/**
 * Custom Equipment Modal Component
 *
 * Modal for creating custom equipment profiles from current recipe settings.
 */

import React, { useState } from 'react';
import type { EquipmentProfile } from '../../domain/models/Equipment';

interface CustomEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: EquipmentProfile) => void;
  currentSettings: {
    batchVolumeL: number;
    boilTimeMin: number;
    boilOffRateLPerHour: number;
    mashEfficiencyPercent: number;
    grainAbsorptionLPerKg: number;
    mashTunDeadspaceLiters: number;
    kettleLossLiters: number;
    fermenterLossLiters: number;
    hopsAbsorptionLPerKg: number;
  };
}

export const CustomEquipmentModal: React.FC<CustomEquipmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const newProfile: EquipmentProfile = {
      name: name.trim(),
      description: description.trim() || undefined,
      batchSizeL: currentSettings.batchVolumeL,
      boilTimeMin: currentSettings.boilTimeMin,
      boilOffRateL_hr: currentSettings.boilOffRateLPerHour,
      mashTunDeadspaceL: currentSettings.mashTunDeadspaceLiters,
      kettleDeadspaceL: currentSettings.kettleLossLiters,
      fermenterLossL: currentSettings.fermenterLossLiters,
      grainAbsorptionL_kg: currentSettings.grainAbsorptionLPerKg,
      hopAbsorptionL_g: currentSettings.hopsAbsorptionLPerKg / 1000, // Convert from L/kg to L/g
      mashEfficiency: currentSettings.mashEfficiencyPercent,
      brewhouseEfficiency: currentSettings.mashEfficiencyPercent, // Use mash efficiency as default
      isCustom: true,
    };

    onSave(newProfile);

    // Reset and close
    setName('');
    setDescription('');
    onClose();
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          Save Equipment Profile
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Save your current equipment settings as a reusable profile.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Profile Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Custom Setup"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your equipment setup..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};
