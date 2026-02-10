/**
 * Other Ingredients Panel Component
 *
 * Displays and manages additional brewing ingredients like finings,
 * spices, water agents, and herbs. Supports inline editing of amounts,
 * units, and timing for each ingredient.
 */

import type { OtherIngredient } from "../../../domain/models/Recipe";
import { CATEGORY_LABELS, CATEGORY_COLORS, UNITS, TIMINGS } from "./constants";

type Props = {
  /** List of other ingredients in the recipe */
  ingredients: OtherIngredient[];
  /** Callback to open the ingredient picker modal */
  onOpenPicker: () => void;
  /** Callback when an ingredient is updated */
  onUpdate: (id: string, changes: Partial<OtherIngredient>) => void;
  /** Callback when an ingredient is removed */
  onRemove: (id: string) => void;
};

export default function OtherIngredientsPanel({
  ingredients,
  onOpenPicker,
  onUpdate,
  onRemove,
}: Props) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Other Ingredients
        </h3>
        <button
          onClick={onOpenPicker}
          className="text-sm px-3 py-1.5 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] transition-colors"
        >
          + Add
        </button>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No additional ingredients — finings, spices, water agents, etc.
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map((ing) => (
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
                  onUpdate(ing.id, {
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
                    onUpdate(ing.id, {
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
                    onUpdate(ing.id, {
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
                onClick={() => onRemove(ing.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition shrink-0"
                aria-label={`Remove ${ing.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
