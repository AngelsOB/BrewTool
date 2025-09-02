import { useEffect, useMemo, useState } from "react";
import InputWithSuffix from "../../../components/InputWithSuffix";
import type { GrainItem } from "../types";
import {
  addCustomGrain,
  getGrainPresets,
  getGrainPresetsGroupedByVendor,
} from "../../../utils/presets";
import SearchSelect from "../../../components/SearchSelect";

export function GrainBill({
  grains,
  totalGrainKg,
  batchVolumeL,
  efficiencyPct,
  effectiveAttenuationDecimal,
  currentAbvPct,
  onAdd,
  onUpdate,
  onRemove,
}: {
  grains: GrainItem[];
  totalGrainKg: number;
  batchVolumeL: number;
  efficiencyPct: number;
  effectiveAttenuationDecimal: number; // 0..1
  currentAbvPct: number; // %
  onAdd: () => void;
  onUpdate: (index: number, next: GrainItem) => void;
  onRemove: (id: string) => void;
}) {
  // Local UI mode: "amount" maintains direct weights, "percent" drives weights from % and target ABV
  const [mode, setMode] = useState<"amount" | "percent">("amount");
  // Target ABV input for percent mode; initialize from current recipe ABV
  const [targetAbvPct, setTargetAbvPct] = useState<number>(
    Number.isFinite(currentAbvPct) && currentAbvPct > 0 ? currentAbvPct : 5
  );
  // Per-row percent values (by weight). Keyed by GrainItem.id
  const [percentById, setPercentById] = useState<Record<string, number>>({});
  // Track per-row saved state for custom preset save UI
  const [savedCustomGrain, setSavedCustomGrain] = useState<
    Record<string, "idle" | "saved" | "done">
  >({});
  // Removed inline custom name editing; using modal instead

  // Custom grain modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customIndex, setCustomIndex] = useState<number | null>(null);
  const [newGrainDraft, setNewGrainDraft] = useState<{
    name: string;
    colorLovibond: number;
    potentialGu: number;
    type: "grain" | "adjunct_mashable" | "extract" | "sugar";
  }>({ name: "", colorLovibond: 10, potentialGu: 36, type: "grain" });

  // When switching to percent mode, seed percents from current weights
  useEffect(() => {
    if (mode !== "percent") return;
    const seeded: Record<string, number> = {};
    const total = Math.max(0, totalGrainKg || 0);
    for (const g of grains) {
      const pct = total > 0 ? (g.weightKg / total) * 100 : 0;
      seeded[g.id] = Number.isFinite(pct) ? Number(pct.toFixed(1)) : 0;
    }
    setPercentById((prev) => ({ ...seeded, ...prev }));
  }, [mode, grains, totalGrainKg]);

  // Helper to recompute weights from current percents + target ABV
  const recalcWeightsFromPercents = useMemo(() => {
    return () => {
      if (mode !== "percent") return;
      const galPerL = 0.264172;
      const lbsPerKg = 2.20462;
      const effBrewhouse = Math.max(0, Math.min(1, efficiencyPct / 100));
      const volumeGal = Math.max(0, batchVolumeL * galPerL);
      const effAtt = Math.max(0.4, Math.min(0.98, effectiveAttenuationDecimal));
      if (!(volumeGal > 0) || !(effBrewhouse > 0) || !(effAtt > 0)) return;

      // Invert ABV ≈ (OG-1)*131.25*effAtt → OG
      const ogTarget = 1 + Math.max(0, targetAbvPct) / (131.25 * effAtt);
      const pointsPerGal = (ogTarget - 1) * 1000; // GU
      const totalGuNeeded = pointsPerGal * volumeGal;

      // Effective GU per lb of total grain, given percentages and ppg by item
      let effectiveGuPerLb = 0;
      for (const g of grains) {
        const pct = Math.max(0, percentById[g.id] ?? 0) / 100;
        const isMashable =
          g.type === "grain" || g.type === "adjunct_mashable" || g.type == null;
        const eff = isMashable ? effBrewhouse : 1;
        effectiveGuPerLb += pct * g.potentialGu * eff;
      }
      if (!(effectiveGuPerLb > 0)) return;

      const totalLb = totalGuNeeded / effectiveGuPerLb; // total grain weight in lb
      const totalKg = totalLb / lbsPerKg;
      // Apply updates
      grains.forEach((g, i) => {
        const pct = Math.max(0, percentById[g.id] ?? 0) / 100;
        const nextKg = totalKg * pct;
        const rounded = Number.isFinite(nextKg) ? Number(nextKg.toFixed(3)) : 0;
        if (rounded !== g.weightKg) {
          onUpdate(i, { ...g, weightKg: rounded });
        }
      });
    };
  }, [
    mode,
    grains,
    percentById,
    targetAbvPct,
    batchVolumeL,
    efficiencyPct,
    effectiveAttenuationDecimal,
    onUpdate,
  ]);

  // Recalculate when inputs change in percent mode
  useEffect(() => {
    recalcWeightsFromPercents();
  }, [recalcWeightsFromPercents]);

  const totalPercent = useMemo(() => {
    if (mode !== "percent") return 0;
    return grains.reduce((acc, g) => acc + (percentById[g.id] ?? 0), 0);
  }, [mode, grains, percentById]);

  return (
    <section className="section-soft space-y-3 pb-1 sm:pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text-primary-strong">Grain Bill</div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center rounded-md border overflow-hidden text-xs">
            <button
              type="button"
              className={`px-2 py-1 ${
                mode === "amount" ? "bg-white/60" : "bg-transparent"
              }`}
              onClick={() => setMode("amount")}
            >
              Amount
            </button>
            <button
              type="button"
              className={`px-2 py-1 ${
                mode === "percent" ? "bg-white/60" : "bg-transparent"
              }`}
              onClick={() => setMode("percent")}
            >
              %
            </button>
          </div>
          {mode === "percent" && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted">Target ABV</div>
              <InputWithSuffix
                value={targetAbvPct}
                onChange={(n) => setTargetAbvPct(Math.max(0, n))}
                suffix=" %"
                suffixClassName="right-2 text-[10px]"
                step={0.1}
                placeholder="5.0"
                className="w-24"
              />
              <div className="text-[10px] text-muted">
                sum {totalPercent.toFixed(1)}%
              </div>
            </div>
          )}
          <button className="btn-neon" onClick={onAdd}>
            + Add Grain
          </button>
        </div>
      </div>
      <div className="hidden sm:grid gap-2 text-xs text-muted sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,.5fr)_min-content]">
        <div>Grain</div>
        <div>{mode === "amount" ? "Weight" : "Percent"}</div>
        <div>{mode === "amount" ? "Grain %" : "Weight (derived)"}</div>
        <div></div>
      </div>
      {grains.map((g, i) => (
        <div
          key={g.id}
          className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,.5fr)_min-content] gap-2"
        >
          <label className="flex flex-col">
            <div className="text-xs text-muted mb-1 sm:hidden">Grain</div>
            <div className="relative">
              {g.customNameLocked ? (
                <>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="Custom grain name"
                    value={g.name}
                    onChange={(e) =>
                      onUpdate(i, { ...g, name: e.target.value })
                    }
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <InputWithSuffix
                      value={g.colorLovibond}
                      onChange={(n) => onUpdate(i, { ...g, colorLovibond: n })}
                      suffix=" °L"
                      suffixClassName="right-2 text-[10px]"
                      step={1}
                      placeholder="10"
                    />
                    <InputWithSuffix
                      value={g.potentialGu}
                      onChange={(n) => onUpdate(i, { ...g, potentialGu: n })}
                      suffix=" GU"
                      suffixClassName="right-2 text-[10px]"
                      step={0.1}
                      placeholder="34.0"
                    />
                  </div>
                  <div className="mt-1">
                    {savedCustomGrain[g.id] === "saved" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <span className="relative inline-flex">
                          <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="relative w-3 h-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.28a.75.75 0 10-1.22-.9l-3.236 4.386-1.49-1.49a.75.75 0 10-1.06 1.06l2.1 2.1a.75.75 0 001.14-.094l3.766-5.062z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <span className="text-[11px]">Saved</span>
                      </span>
                    ) : null}
                    {savedCustomGrain[g.id] !== "done" &&
                      savedCustomGrain[g.id] !== "saved" && (
                        <button
                          type="button"
                          title="Save preset"
                          className="rounded border px-2 py-1 text-[10px] text-neutral-700 hover:bg-white/70 bg-white/50 inline-flex items-center gap-2"
                          onClick={() => {
                            const name = (g.name || "").trim();
                            if (!name) return;
                            addCustomGrain({
                              name,
                              colorLovibond: Number(g.colorLovibond) || 0,
                              potentialGu: Number(g.potentialGu) || 0,
                            });
                            // Switch to preset selection and hide the save button after 1s
                            setSavedCustomGrain((prev) => ({
                              ...prev,
                              [g.id]: "saved",
                            }));
                            onUpdate(i, {
                              ...g,
                              name,
                              customNameLocked: false,
                              customNameSelected: false,
                            });
                            window.setTimeout(() => {
                              setSavedCustomGrain((prev) => ({
                                ...prev,
                                [g.id]: "done",
                              }));
                            }, 1000);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-3 h-3"
                          >
                            <path d="M4.5 3.75A2.25 2.25 0 016.75 1.5h8.69a2.25 2.25 0 011.59.66l3.81 3.81a2.25 2.25 0 01.66 1.59v11.34a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18.9V3.75z" />
                            <path
                              fillRule="evenodd"
                              d="M7.5 8.25a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM8.47 12.22a.75.75 0 011.06 0l1.72 1.72 4.22-4.22a.75.75 0 111.06 1.06l-4.75 4.75a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Save</span>
                        </button>
                      )}
                  </div>
                </>
              ) : (
                <>
                  {(() => {
                    const options = getGrainPresets().map((p) => {
                      const c = (p as { originCode?: string }).originCode;
                      let flag = "";
                      if (c && c.length === 2) {
                        const cc = c.toUpperCase();
                        const base = 127397;
                        flag =
                          String.fromCodePoint(base + cc.charCodeAt(0)) +
                          String.fromCodePoint(base + cc.charCodeAt(1)) +
                          " ";
                      }
                      return { label: `${flag}${p.name}`, value: p.name };
                    });
                    // Build grouped view: grain group · vendor
                    const grouped = getGrainPresetsGroupedByVendor().map(
                      (g) => ({
                        label: g.label,
                        options: g.items.map((p) => {
                          const c = (p as { originCode?: string }).originCode;
                          let flag = "";
                          // Remove country flags for Generic vendor sections
                          const isGeneric = g.label.trim().endsWith("Generic");
                          if (!isGeneric && c && c.length === 2) {
                            const cc = c.toUpperCase();
                            const base = 127397;
                            flag =
                              String.fromCodePoint(base + cc.charCodeAt(0)) +
                              String.fromCodePoint(base + cc.charCodeAt(1)) +
                              " ";
                          }
                          return { label: `${flag}${p.name}`, value: p.name };
                        }),
                      })
                    );
                    // Append Custom option
                    options.push({
                      label: "Custom grain...",
                      value: "__add_custom__",
                    });
                    grouped.push({
                      label: "Custom",
                      options: [
                        { label: "Custom grain...", value: "__add_custom__" },
                      ],
                    });
                    // Build label lookup map so selected value renders with flag
                    const labelByValue = new Map<string, string>();
                    for (const o of options) labelByValue.set(o.value, o.label);
                    for (const grp of grouped) {
                      for (const o of grp.options)
                        labelByValue.set(o.value, o.label);
                    }
                    const formatSelected = (v: string) => {
                      const label = labelByValue.get(v) ?? v;
                      const codepoints = Array.from(label);
                      const MAX = 45; // cap displayed label length
                      return codepoints.length > MAX
                        ? codepoints.slice(0, MAX - 1).join("") + "…"
                        : label;
                    };
                    return (
                      <SearchSelect
                        value={g.name}
                        options={options}
                        groups={grouped}
                        placeholder="Grains... type to search"
                        formatSelectedLabel={formatSelected}
                        onChange={(value) => {
                          if (value === "__add_custom__") {
                            setCustomIndex(i);
                            setNewGrainDraft({
                              name: (g.name || "").trim(),
                              colorLovibond: 10,
                              potentialGu: 36,
                              type: "grain",
                            });
                            setShowCustomModal(true);
                            return;
                          }
                          const preset = getGrainPresets().find(
                            (p) => p.name === value
                          );
                          if (preset) {
                            onUpdate(i, {
                              ...g,
                              name: preset.name,
                              colorLovibond: (
                                preset as { colorLovibond: number }
                              ).colorLovibond,
                              potentialGu: (preset as { potentialGu: number })
                                .potentialGu,
                              type:
                                (
                                  preset as {
                                    type?:
                                      | "grain"
                                      | "adjunct_mashable"
                                      | "extract"
                                      | "sugar";
                                  }
                                ).type ?? "grain",
                              customNameSelected: false,
                              customNameLocked: false,
                            } as GrainItem);
                          } else {
                            onUpdate(i, { ...g, name: value });
                          }
                        }}
                        onCreate={(q) => {
                          setCustomIndex(i);
                          setNewGrainDraft({
                            name: (q || "").trim(),
                            colorLovibond: 10,
                            potentialGu: 36,
                            type: "grain",
                          });
                          setShowCustomModal(true);
                        }}
                      />
                    );
                  })()}
                  {null}
                </>
              )}
              <div
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-600 px-2 py-0.5"
                aria-hidden="true"
              >
                {g.colorLovibond}°L
              </div>
            </div>
          </label>
          {mode === "amount" ? (
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">
                Weight (kg)
              </div>
              <InputWithSuffix
                value={g.weightKg}
                onChange={(n) => onUpdate(i, { ...g, weightKg: n })}
                suffix=" kg"
                suffixClassName="right-3 text-[10px]"
                step={0.01}
                placeholder="0.00"
              />
            </label>
          ) : (
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">
                Percent (%)
              </div>
              <InputWithSuffix
                value={percentById[g.id] ?? 0}
                onChange={(n) =>
                  setPercentById((prev) => ({
                    ...prev,
                    [g.id]: Math.max(0, n),
                  }))
                }
                suffix=" %"
                suffixClassName="right-3 text-[10px]"
                step={0.1}
                placeholder="0.0"
              />
            </label>
          )}
          {mode === "amount" ? (
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">
                Grain Bill (%)
              </div>
              <div className="rounded-md border px-3 py-2 bg-white/40 text-sm">
                {totalGrainKg > 0
                  ? ((g.weightKg / totalGrainKg) * 100).toFixed(1)
                  : "0.0"}
                %
              </div>
            </label>
          ) : (
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">
                Weight (kg)
              </div>
              <div className="rounded-md border px-3 py-2 bg-white/40 text-sm">
                {(g.weightKg || 0).toFixed(3)} kg
              </div>
            </label>
          )}
          <div className="flex justify-end items-center">
            <button
              className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
              onClick={() => onRemove(g.id)}
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
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center rounded-md border overflow-hidden text-xs">
            <button
              type="button"
              className={`px-2 py-1 ${
                mode === "amount" ? "bg-white/60" : "bg-transparent"
              }`}
              onClick={() => setMode("amount")}
            >
              Amount
            </button>
            <button
              type="button"
              className={`px-2 py-1 ${
                mode === "percent" ? "bg-white/60" : "bg-transparent"
              }`}
              onClick={() => setMode("percent")}
            >
              %
            </button>
          </div>
          {mode === "percent" && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted">ABV</div>
              <InputWithSuffix
                value={targetAbvPct}
                onChange={(n) => setTargetAbvPct(Math.max(0, n))}
                suffix=" %"
                suffixClassName="right-2 text-[10px]"
                step={0.1}
                placeholder="5.0"
                className="w-24"
              />
            </div>
          )}
        </div>
        {mode === "percent" && (
          <div className="text-[10px] text-muted mb-2">
            sum {totalPercent.toFixed(1)}%
          </div>
        )}
        <button className="w-full btn-neon" onClick={onAdd}>
          + Add Grain
        </button>
      </div>
      {showCustomModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCustomModal(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg border border-white/15 bg-black/20 backdrop-blur p-4 shadow-xl">
            <div className="text-sm font-semibold mb-3">Add new grain?</div>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Grain name"
                value={newGrainDraft.name}
                onChange={(e) =>
                  setNewGrainDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <InputWithSuffix
                  value={newGrainDraft.colorLovibond}
                  onChange={(n) =>
                    setNewGrainDraft((d) => ({ ...d, colorLovibond: n }))
                  }
                  suffix=" °L"
                  suffixClassName="right-2 text-[10px]"
                  step={1}
                  placeholder="10"
                />
                <InputWithSuffix
                  value={newGrainDraft.potentialGu}
                  onChange={(n) =>
                    setNewGrainDraft((d) => ({ ...d, potentialGu: n }))
                  }
                  suffix=" GU"
                  suffixClassName="right-2 text-[10px]"
                  step={0.1}
                  placeholder="36.0"
                />
              </div>
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
                    const name = newGrainDraft.name.trim();
                    if (!name) return;
                    addCustomGrain({
                      name,
                      colorLovibond: Number(newGrainDraft.colorLovibond) || 0,
                      potentialGu: Number(newGrainDraft.potentialGu) || 0,
                    });
                    const idx = customIndex ?? 0;
                    const current = grains[idx];
                    onUpdate(idx, {
                      ...current,
                      name,
                      colorLovibond: Number(newGrainDraft.colorLovibond) || 0,
                      potentialGu: Number(newGrainDraft.potentialGu) || 0,
                      type: newGrainDraft.type,
                      customNameSelected: false,
                      customNameLocked: false,
                    } as GrainItem);
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

export default GrainBill;
