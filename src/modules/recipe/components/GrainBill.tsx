import { useEffect, useMemo, useState } from "react";
import InputWithSuffix from "../../../components/InputWithSuffix";
import type { GrainItem } from "../../../hooks/useRecipeStore";
import { getGrainPresets } from "../../../utils/presets";

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
              <select
                className="w-full rounded-md border py-2.5 pl-2 pr-12"
                onChange={(e) => {
                  if (e.target.value === "__add_custom__") {
                    return;
                  }
                  const preset = getGrainPresets().find(
                    (p) => p.name === e.target.value
                  );
                  if (!preset) return;
                  onUpdate(i, {
                    ...g,
                    name: preset.name,
                    colorLovibond: (preset as { colorLovibond: number })
                      .colorLovibond,
                    potentialGu: (preset as { potentialGu: number })
                      .potentialGu,
                    type: "grain",
                  } as GrainItem);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Grains...
                </option>
                {getGrainPresets().map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
                <option value="__add_custom__">+ Add Custom Grain</option>
              </select>
              <div
                className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-xs text-neutral-600 px-2 py-0.5"
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
    </section>
  );
}

export default GrainBill;
