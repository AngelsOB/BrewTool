import { addCustomYeast, getYeastPresets } from "../../../utils/presets";
import type { YeastItem } from "../types";
import YeastPitchCalc from "../../../components/YeastPitchCalc";
import InputWithSuffix from "../../../components/InputWithSuffix";
import { useState } from "react";
import SearchSelect from "../../../components/SearchSelect";

export default function YeastSection({
  yeast,
  onChangeYeast,
  ogUsed,
  batchVolumeL,
  onStarterChange,
  starterInitial,
}: {
  yeast: YeastItem;
  onChangeYeast: (next: YeastItem) => void;
  ogUsed: number;
  batchVolumeL: number;
  onStarterChange?: (state: {
    yeastType: "liquid-100" | "liquid-200" | "dry" | "slurry";
    packs: number;
    mfgDate: string;
    slurryLiters: number;
    slurryBillionPerMl: number;
    steps: Array<{
      id: string;
      liters: number;
      gravity: number;
      model:
        | { kind: "white"; aeration: "none" | "shaking" }
        | { kind: "braukaiser" };
      dmeGrams: number;
      endBillion: number;
    }>;
    requiredCellsB: number;
    cellsAvailableB: number;
    finalEndB: number;
    totalStarterL: number;
    totalDmeG: number;
  }) => void;
  starterInitial?: {
    yeastType: "liquid-100" | "liquid-200" | "dry" | "slurry";
    packs: number;
    mfgDate: string;
    slurryLiters: number;
    slurryBillionPerMl: number;
    steps: Array<{
      id: string;
      liters: number;
      gravity: number;
      model:
        | { kind: "white"; aeration: "none" | "shaking" }
        | { kind: "braukaiser" };
      dmeGrams: number;
      endBillion: number;
    }>;
    requiredCellsB: number;
    cellsAvailableB: number;
    finalEndB: number;
    totalStarterL: number;
    totalDmeG: number;
  } | null;
}) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [newYeastDraft, setNewYeastDraft] = useState<{
    name: string;
    attenuationPercent?: number;
    category?: string;
  }>({
    name: "",
  });
  return (
    <section className="section-soft space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text-primary-strong">Yeast</div>
        {yeast.attenuationPercent != null ? (
          <div className="hidden sm:block text-xs text-muted">
            Est. Attenuation: {(yeast.attenuationPercent * 100).toFixed(0)}%
          </div>
        ) : null}
      </div>
      <label className="flex flex-col">
        {(() => {
          const presets = getYeastPresets();
          const options = presets
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => ({ label: p.name, value: p.name }));
          const byCategory = new Map<
            string,
            { label: string; options: { label: string; value: string }[] }
          >();
          for (const p of presets) {
            const cat = (p as { category?: string }).category || "Other";
            if (!byCategory.has(cat))
              byCategory.set(cat, { label: cat, options: [] });
            byCategory.get(cat)!.options.push({ label: p.name, value: p.name });
          }
          options.push({ label: "Custom yeast...", value: "__custom__" });
          const groups = Array.from(byCategory.values());
          groups.push({
            label: "Custom",
            options: [{ label: "Custom yeast...", value: "__custom__" }],
          });
          // Build selected-label formatter with truncation like other sections
          const labelByValue = new Map<string, string>();
          for (const o of options) labelByValue.set(o.value, o.label);
          for (const g of groups)
            for (const o of g.options) labelByValue.set(o.value, o.label);
          const formatSelected = (v: string) => {
            const p = presets.find((x) => x.name === v);
            const base = p ? `${p.category || "Other"} - ${p.name}` : v;
            const codepoints = Array.from(base);
            const MAX = 45;
            return codepoints.length > MAX
              ? codepoints.slice(0, MAX - 1).join("") + "…"
              : base;
          };
          return (
            <SearchSelect
              value={yeast.name}
              options={options}
              groups={groups}
              placeholder="Select yeast... type to search"
              formatSelectedLabel={formatSelected}
              onChange={(value) => {
                if (value === "__custom__") {
                  setNewYeastDraft({
                    name: "",
                    attenuationPercent: 0.75,
                    category: "Custom",
                  });
                  setShowCustomModal(true);
                  return;
                }
                const preset = getYeastPresets().find((p) => p.name === value);
                if (preset) {
                  onChangeYeast(preset);
                } else {
                  // Reflect free-typed value so input can be edited/erased
                  onChangeYeast({
                    name: value,
                    attenuationPercent: yeast.attenuationPercent,
                  });
                }
              }}
              onCreate={(q) => {
                setNewYeastDraft({
                  name: (q || "").trim(),
                  attenuationPercent: 0.75,
                  category: "Custom",
                });
                setShowCustomModal(true);
              }}
            />
          );
        })()}
      </label>
      {yeast.attenuationPercent != null ? (
        <div className="mt-1 text-[11px] text-white/50 translate-x-2">
          Est. Attenuation: {(yeast.attenuationPercent * 100).toFixed(0)}%
        </div>
      ) : null}
      <div className="pt-1">
        <YeastPitchCalc
          og={ogUsed}
          volumeL={batchVolumeL}
          onChange={onStarterChange}
          initial={starterInitial ?? undefined}
        />
      </div>
      {showCustomModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCustomModal(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg border border-white/15 bg-black/20 backdrop-blur p-4 shadow-xl">
            <div className="text-sm font-semibold mb-3">Add new yeast?</div>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Yeast name"
                value={newYeastDraft.name}
                onChange={(e) =>
                  setNewYeastDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <InputWithSuffix
                value={newYeastDraft.attenuationPercent ?? 0.75}
                onChange={(n: number) =>
                  setNewYeastDraft((d) => ({
                    ...d,
                    attenuationPercent: Math.max(0, Math.min(1, n)),
                  }))
                }
                suffix=" attn"
                suffixClassName="right-2 text-[10px]"
                step={0.01}
                placeholder="0.75"
              />
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Category (optional)"
                value={newYeastDraft.category ?? ""}
                onChange={(e) =>
                  setNewYeastDraft((d) => ({ ...d, category: e.target.value }))
                }
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
                    const name = (newYeastDraft.name || "").trim();
                    if (!name) return;
                    addCustomYeast({
                      name,
                      category: newYeastDraft.category || "Custom",
                      attenuationPercent: newYeastDraft.attenuationPercent,
                    });
                    onChangeYeast({
                      name,
                      attenuationPercent: newYeastDraft.attenuationPercent,
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
    </section>
  );
}
