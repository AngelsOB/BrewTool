/**
 * CustomFermentableModal Component
 *
 * Modal for creating custom fermentable presets.
 * Allows users to define their own grains/fermentables with:
 * - Name
 * - PPG (Points Per Pound Per Gallon)
 * - Color (Lovibond)
 * - Category
 */

import { useState } from "react";
import type { FermentablePreset } from "../../domain/models/Presets";

interface CustomFermentableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: FermentablePreset) => void;
}

export default function CustomFermentableModal({
  isOpen,
  onClose,
  onSave,
}: CustomFermentableModalProps) {
  const [name, setName] = useState("");
  const [potentialGu, setPotentialGu] = useState(37);
  const [colorLovibond, setColorLovibond] = useState(2);
  const [type, setType] = useState<FermentablePreset["type"]>("grain");

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a fermentable name");
      return;
    }

    const newPreset: FermentablePreset = {
      name: name.trim(),
      potentialGu,
      colorLovibond,
      type,
    };

    onSave(newPreset);
    handleClose();
  };

  const handleClose = () => {
    setName("");
    setPotentialGu(37);
    setColorLovibond(2);
    setType("grain");
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
        <h3 className="text-xl font-semibold mb-4">Create Custom Fermentable</h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Fermentable Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Custom Pale Malt"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* PPG */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Potential GU (Gravity Units / PPG)
            </label>
            <input
              type="number"
              value={potentialGu}
              onChange={(e) => setPotentialGu(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="1"
              min="0"
              max="50"
            />
            <p className="text-xs text-gray-600 mt-1">
              Typical range: Base malts 35-38, Crystal malts 33-35, Sugars 46
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Color (°Lovibond)
            </label>
            <input
              type="number"
              value={colorLovibond}
              onChange={(e) => setColorLovibond(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="1"
              min="0"
              max="600"
            />
            <p className="text-xs text-gray-600 mt-1">
              Pale malt ~2°L, Crystal 20-120°L, Roasted 300-600°L
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FermentablePreset["type"])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="grain">Grain (Malt)</option>
              <option value="adjunct_mashable">Adjunct (Mashable)</option>
              <option value="extract">Extract</option>
              <option value="sugar">Sugar</option>
            </select>
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
