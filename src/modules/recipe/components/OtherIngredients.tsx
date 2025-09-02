import { useState } from "react";
import AutoWidthUnitSelect from "../../../components/AutoWidthUnitSelect";
import InputWithSuffix from "../../../components/InputWithSuffix";
import type { OtherIngredient, OtherIngredientCategory } from "../types";
import SearchSelect from "../../../components/SearchSelect";

export default function OtherIngredients({
  items,
  presetByCategory,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: OtherIngredient[];
  presetByCategory: Record<OtherIngredientCategory, string[]>;
  onAdd: () => void;
  onUpdate: (index: number, next: OtherIngredient) => void;
  onRemove: (id: string) => void;
}) {
  const units = [
    "g",
    "kg",
    "tsp",
    "tbsp",
    "oz",
    "lb",
    "ml",
    "l",
    "drops",
    "capsule",
    "tablet",
    "packet",
  ];
  const timings: OtherIngredient["timing"][] = [
    "mash",
    "boil",
    "whirlpool",
    "secondary",
    "kegging",
    "bottling",
  ];

  // Autofocus for custom name input when selecting Custom
  // no refs needed for modal-based custom entry

  // Modal state for custom ingredient entry (aligned with GrainBill/Hops)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customIndex, setCustomIndex] = useState<number | null>(null);
  const [newNameDraft, setNewNameDraft] = useState<string>("");

  return (
    <section
      className={"section-soft space-y-3 " + (items.length === 0 ? "py-2" : "")}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text-primary-strong">
          Additional Ingredients
        </div>
        <button className="hidden sm:block btn-neon" onClick={onAdd}>
          + Add Ingredient
        </button>
      </div>

      {items.length > 0 && (
        <div className="hidden sm:grid gap-2 text-xs text-muted sm:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)_minmax(0,.6fr)_minmax(0,1fr)_min-content]">
          <div>Name</div>
          <div>Timing</div>
          <div>Amount</div>
          <div>Notes</div>
          <div></div>
        </div>
      )}

      {items.map((ing, i) => (
        <div
          key={ing.id}
          className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)_minmax(0,.6fr)_minmax(0,1fr)_min-content] gap-2"
        >
          <label className="flex flex-col">
            <div className="text-xs text-muted mb-1 sm:hidden">Name</div>
            {(() => {
              const options = Object.values(presetByCategory)
                .flat()
                .map((n) => ({ label: n, value: n }));
              const groups = Object.entries(presetByCategory).map(
                ([cat, items]) => ({
                  label: cat
                    .replace("-", " ")
                    .replace(/\b\w/g, (m) => m.toUpperCase()),
                  options: items.map((n) => ({ label: n, value: n })),
                })
              );
              options.push({
                label: "Custom ingredient...",
                value: "__custom__",
              });
              groups.push({
                label: "Custom",
                options: [
                  { label: "Custom ingredient...", value: "__custom__" },
                ],
              });
              return (
                <SearchSelect
                  value={ing.name}
                  options={options}
                  groups={groups}
                  placeholder="Select... type to search"
                  onChange={(val) => {
                    if (val === "__custom__") {
                      setCustomIndex(i);
                      setNewNameDraft((ing.name || "").trim());
                      setShowCustomModal(true);
                      return;
                    }
                    let cat: OtherIngredientCategory = "other";
                    for (const [k, arr] of Object.entries(presetByCategory)) {
                      if (arr.includes(val)) {
                        cat = k as OtherIngredientCategory;
                        break;
                      }
                    }
                    onUpdate(i, {
                      ...ing,
                      name: val,
                      category: cat,
                      customNameSelected: false,
                      customNameLocked: false,
                    });
                  }}
                  onCreate={(q) => {
                    setCustomIndex(i);
                    setNewNameDraft((q || "").trim());
                    setShowCustomModal(true);
                  }}
                />
              );
            })()}
          </label>

          <label className="flex flex-col">
            <div className="text-xs text-muted mb-1 sm:hidden">Timing</div>
            <select
              className="w-full rounded-md border px-2 py-2.5"
              value={ing.timing}
              onChange={(e) =>
                onUpdate(i, {
                  ...ing,
                  timing: e.target.value as OtherIngredient["timing"],
                })
              }
            >
              {timings.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-[minmax(0,1fr)_max-content] gap-3 items-stretch">
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">Amount</div>
              <InputWithSuffix
                value={ing.amount}
                onChange={(n) => {
                  const isDiscrete = ["tablet", "packet", "capsule"].includes(
                    ing.unit
                  );
                  const nextVal = isDiscrete ? Math.round(n) : n;
                  onUpdate(i, { ...ing, amount: nextVal });
                }}
                step={
                  ["tablet", "packet", "capsule"].includes(ing.unit) ? 1 : 0.1
                }
                suffix=""
                suffixClassName="right-3 text-[10px]"
                placeholder="0.0"
              />
            </label>
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">Unit</div>
              <AutoWidthUnitSelect
                className="rounded-md border px-2 py-2.5 w-auto text-center shrink-0"
                value={ing.unit}
                options={units}
                onChange={(unit) => {
                  const isDiscrete = ["tablet", "packet", "capsule"].includes(
                    unit
                  );
                  const adjustedAmount = isDiscrete
                    ? Math.round(ing.amount || 0)
                    : ing.amount || 0;
                  onUpdate(i, { ...ing, unit, amount: adjustedAmount });
                }}
              />
            </label>
          </div>

          <label className="flex flex-col">
            <div className="text-xs text-muted mb-1 sm:hidden">Notes</div>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={ing.notes ?? ""}
              placeholder="Optional notes"
              onChange={(e) => onUpdate(i, { ...ing, notes: e.target.value })}
            />
          </label>

          <div className="flex justify-end items-center">
            <button
              className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
              onClick={() => onRemove(ing.id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {showCustomModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCustomModal(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg border border-white/15 bg-black/20 backdrop-blur p-4 shadow-xl">
            <div className="text-sm font-semibold mb-3">
              Add custom ingredient?
            </div>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Ingredient name"
                value={newNameDraft}
                onChange={(e) => setNewNameDraft(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white transition duration-150 hover:bg-white/10 hover:shadow-[0_0_13px_var(--coral-600)]/80 active:bg-white/15 active:shadow-[0_0_20px_var(--coral-600)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-600)]/60"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-md border border-white/20 bg-black/10 text-white px-3 py-2 text-sm transition duration-150 hover:bg-black/20 hover:shadow-[0_0_13px_var(--coral-600)]/80 active:bg-black/30 active:shadow-[0_0_20px_var(--coral-600)] active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-600)]/60"
                  onClick={() => {
                    const name = newNameDraft.trim();
                    if (!name) return;
                    const idx = customIndex ?? 0;
                    const current = items[idx];
                    onUpdate(idx, {
                      ...current,
                      name,
                      category: current.category ?? "other",
                      customNameSelected: false,
                      customNameLocked: false,
                    });
                    setShowCustomModal(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button className="block sm:hidden w-full btn-neon" onClick={onAdd}>
        + Add Ingredient
      </button>
    </section>
  );
}
