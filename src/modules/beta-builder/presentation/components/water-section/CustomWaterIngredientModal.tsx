/**
 * Custom Water Ingredient Modal Component
 *
 * Modal for adding a custom ingredient with a name and category.
 */

import { useState } from "react";
import type { OtherIngredientCategory } from "../../../domain/models/Recipe";
import ModalOverlay from "../ModalOverlay";
import { CATEGORY_LABELS } from "./constants";

type Props = {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal closes */
  onClose: () => void;
  /** Callback when a custom ingredient is added */
  onAdd: (name: string, category: OtherIngredientCategory) => void;
};

export default function CustomWaterIngredientModal({
  isOpen,
  onClose,
  onAdd,
}: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<OtherIngredientCategory>("other");

  const handleClose = () => {
    setName("");
    setCategory("other");
    onClose();
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    handleClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Custom Ingredient</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingredient name"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600 dark:text-gray-400">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as OtherIngredientCategory)}
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
              onClick={handleClose}
              className="flex-1 px-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              className="flex-1 px-3 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
