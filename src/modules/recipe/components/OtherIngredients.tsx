import AutoWidthUnitSelect from "../../../components/AutoWidthUnitSelect";
import InputWithSuffix from "../../../components/InputWithSuffix";
import type {
  OtherIngredient,
  OtherIngredientCategory,
} from "../../../hooks/useRecipeStore";

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
            {ing.customNameLocked ? (
              <input
                className="rounded-md border px-3 py-2"
                placeholder="Custom name"
                value={ing.name}
                onChange={(e) => onUpdate(i, { ...ing, name: e.target.value })}
              />
            ) : (
              <>
                <select
                  className="w-full rounded-md border px-2 py-2.5"
                  value={(() => {
                    if (ing.customNameSelected && !ing.customNameLocked) {
                      return "__custom__";
                    }
                    const allNames = Object.values(presetByCategory).flat();
                    if (!ing.name) return "";
                    return allNames.includes(ing.name)
                      ? ing.name
                      : "__custom__";
                  })()}
                  onChange={(e) => {
                    const sel = e.target.value;
                    if (sel === "__custom__") {
                      onUpdate(i, {
                        ...ing,
                        name: "",
                        category: "other",
                        customNameSelected: true,
                        customNameLocked: false,
                      });
                    } else {
                      let cat: OtherIngredientCategory = "other";
                      for (const [k, arr] of Object.entries(presetByCategory)) {
                        if (arr.includes(sel)) {
                          cat = k as OtherIngredientCategory;
                          break;
                        }
                      }
                      onUpdate(i, {
                        ...ing,
                        name: sel,
                        category: cat,
                        customNameSelected: false,
                      });
                    }
                  }}
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  {Object.entries(presetByCategory).map(([cat, items]) => (
                    <optgroup
                      key={cat}
                      label={cat
                        .replace("-", " ")
                        .replace(/\b\w/g, (m) => m.toUpperCase())}
                    >
                      {items.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__custom__">Custom (type below)</option>
                </select>
                {(ing.customNameSelected && !ing.customNameLocked) ||
                (() => {
                  const allNames = Object.values(presetByCategory).flat();
                  return ing.name !== "" && !allNames.includes(ing.name);
                })() ? (
                  <input
                    className="mt-2 rounded-md border px-3 py-2"
                    placeholder="Custom name"
                    value={ing.name}
                    onChange={(e) =>
                      onUpdate(i, {
                        ...ing,
                        name: e.target.value,
                        customNameSelected: true,
                      })
                    }
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value) {
                        onUpdate(i, {
                          ...ing,
                          name: value,
                          customNameLocked: true,
                          customNameSelected: false,
                        });
                      }
                    }}
                  />
                ) : null}
              </>
            )}
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

      <button className="block sm:hidden w-full btn-neon" onClick={onAdd}>
        + Add Ingredient
      </button>
    </section>
  );
}
