/**
 * CustomYeastModal Component
 *
 * Modal for creating custom yeast presets.
 * Allows users to define their own yeast strains with:
 * - Name
 * - Lab/Manufacturer
 * - Product ID
 * - Attenuation %
 * - Type (Ale/Lager/Other)
 */

import { useState } from "react";
import type { YeastPreset } from "../../domain/models/Presets";

interface CustomYeastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: YeastPreset) => void;
}

export default function CustomYeastModal({
  isOpen,
  onClose,
  onSave,
}: CustomYeastModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Custom");
  const [attenuationPercent, setAttenuationPercent] = useState(75);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a yeast name");
      return;
    }

    const newPreset: YeastPreset = {
      name: name.trim(),
      category: category.trim(),
      attenuationPercent,
    };

    onSave(newPreset);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setCategory("Custom");
    setAttenuationPercent(75);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleClose}
    >
      <div
        className="bg-[rgb(var(--card))] rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Create Custom Yeast</h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Yeast Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Custom House Blend"
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Custom, Homebrew, House Blend"
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md"
            />
          </div>

          {/* Attenuation */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Attenuation %
            </label>
            <input
              type="number"
              value={attenuationPercent}
              onChange={(e) => setAttenuationPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md"
              step="1"
              min="50"
              max="90"
            />
            <p className="text-xs mt-1">
              Typical range: Low 65-70%, Medium 70-75%, High 75-85%
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Preset
          </button>
        </div>
      </div>
    </div>
  );
}
