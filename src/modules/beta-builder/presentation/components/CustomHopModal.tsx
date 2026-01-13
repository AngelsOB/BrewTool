/**
 * CustomHopModal Component
 *
 * Modal for creating custom hop presets.
 * Allows users to define their own hops with:
 * - Name
 * - Alpha Acid %
 * - Category (optional)
 * - Flavor profile (optional - can be added later if desired)
 */

import { useState } from "react";
import type { HopPreset } from "../../domain/models/Presets";

interface CustomHopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: HopPreset) => void;
}

export default function CustomHopModal({
  isOpen,
  onClose,
  onSave,
}: CustomHopModalProps) {
  const [name, setName] = useState("");
  const [alphaAcidPercent, setAlphaAcidPercent] = useState(10);
  const [category, setCategory] = useState("Custom");

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a hop name");
      return;
    }

    const newPreset: HopPreset = {
      name: name.trim(),
      alphaAcidPercent,
      category,
      // Flavor profile can be added in a future enhancement
    };

    onSave(newPreset);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setAlphaAcidPercent(10);
    setCategory("Custom");
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
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Create Custom Hop</h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Hop Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Custom Hop Blend"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Alpha Acid */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Alpha Acid %
            </label>
            <input
              type="number"
              value={alphaAcidPercent}
              onChange={(e) => setAlphaAcidPercent(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="0.1"
              min="0"
              max="25"
            />
            <p className="text-xs text-gray-600 mt-1">
              Typical range: Aroma hops 3-6%, Dual-purpose 6-12%, Bittering 12-18%
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Custom, Bittering, Aroma, Dual-Purpose"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-gray-700">
              Note: Custom hops won't have flavor profile data. You can still use them for
              calculations and scheduling.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
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
