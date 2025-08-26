import InputWithSuffix from "../../../components/InputWithSuffix";
import InlineEditableNumber from "../../../components/InlineEditableNumber";
import Collapsible from "../../../components/Collapsible";
import FlavorGraphs from "../../../components/FlavorGraphs";
import type { HopItem, HopTimingType } from "../../../hooks/useRecipeStore";
import { getHopPresets } from "../../../utils/presets";
import { ibuSingleAddition } from "../../../calculators/ibu";

export function HopSchedule({
  hops,
  batchVolumeL,
  ogUsed,
  hasSecondTiming,
  onAdd,
  onUpdate,
  onRemove,
  onAddCustomHopRequested,
  showVisualizer,
  onToggleVisualizer,
  hopFlavorSeries,
  estimatedTotalFlavor,
}: {
  hops: HopItem[];
  batchVolumeL: number;
  ogUsed: number;
  hasSecondTiming: boolean;
  onAdd: () => void;
  onUpdate: (index: number, next: HopItem) => void;
  onRemove: (id: string) => void;
  onAddCustomHopRequested: () => void;
  showVisualizer: boolean;
  onToggleVisualizer: () => void;
  hopFlavorSeries: { name: string; flavor: NonNullable<HopItem["flavor"]> }[];
  estimatedTotalFlavor: NonNullable<HopItem["flavor"]>;
}) {
  return (
    <section className="section-soft space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text-primary-strong">Hop Schedule</div>
        <button className="hidden sm:block btn-neon" onClick={onAdd}>
          + Add Hop
        </button>
      </div>
      <div
        className={
          "hidden sm:grid gap-2 text-xs text-muted " +
          (hasSecondTiming
            ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]"
            : "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]")
        }
      >
        <div>Hop</div>
        <div>Alpha %</div>
        <div>Method</div>
        <div>Timing A</div>
        {hasSecondTiming && <div>Timing B</div>}
        <div>Amount</div>
        <div></div>
      </div>

      {hops.map((h, i) => {
        const perHopIbu = ibuSingleAddition(
          {
            weightGrams: h.grams,
            alphaAcidPercent: h.alphaAcidPercent,
            boilTimeMinutes: h.timeMin ?? 0,
            type: h.type,
            whirlpoolTimeMinutes: h.whirlpoolTimeMin,
            whirlpoolTempC: h.whirlpoolTempC,
          },
          batchVolumeL,
          ogUsed
        );
        const gramsPerLiter = batchVolumeL > 0 ? h.grams / batchVolumeL : 0;
        return (
          <div
            key={h.id ?? i}
            className={
              "grid grid-cols-1 gap-2 " +
              (hasSecondTiming
                ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]"
                : "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]")
            }
          >
            <label className="flex flex-col sm:order-1">
              <div className="text-xs text-muted mb-1 sm:hidden">Hop</div>
              <select
                className="w-full rounded-md border px-2 py-2.5"
                onChange={(e) => {
                  if (e.target.value === "__add_custom__") {
                    onAddCustomHopRequested();
                  } else {
                    const preset = getHopPresets().find(
                      (p) => p.name === e.target.value
                    );
                    if (!preset) return;
                    onUpdate(i, {
                      ...h,
                      name: preset.name,
                      alphaAcidPercent: preset.alphaAcidPercent,
                      category: preset.category,
                      flavor: preset.flavor,
                    } as HopItem);
                  }
                }}
                defaultValue={h.name}
              >
                <option value="" disabled>
                  Hops...
                </option>
                {getHopPresets().map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
                <option value="__add_custom__">+ Add Custom Hop</option>
              </select>
              <div className="mt-1 text-[11px] text-white/50 translate-x-2">
                {perHopIbu.toFixed(1)} IBU • {gramsPerLiter.toFixed(2)} g/L
              </div>
            </label>

            <label className="flex flex-col sm:order-3">
              <div className="text-xs text-muted mb-1 sm:hidden">Type</div>
              <select
                className="w-full rounded-md border px-2 py-2.5"
                value={h.type}
                onChange={(e) =>
                  onUpdate(i, { ...h, type: e.target.value as HopTimingType })
                }
              >
                <option value="boil">Boil</option>
                <option value="dry hop">Dry Hop</option>
                <option value="whirlpool">Whirlpool</option>
                <option value="first wort">First Wort</option>
                <option value="mash">Mash</option>
              </select>
            </label>

            <label className="flex flex-col sm:order-6">
              <div className="text-xs text-muted mb-1 sm:hidden">Grams</div>
              <InputWithSuffix
                value={h.grams}
                onChange={(n) => onUpdate(i, { ...h, grams: n })}
                suffix=" g"
                suffixClassName="right-3 text-[10px]"
                step={0.1}
                placeholder="10"
              />
            </label>

            <label className="flex flex-col sm:order-2">
              <div className="text-xs text-muted mb-1 sm:hidden">Alpha %</div>
              <InlineEditableNumber
                value={h.alphaAcidPercent}
                onChange={(n) => onUpdate(i, { ...h, alphaAcidPercent: n })}
                suffix="%"
                suffixClassName="left-9 right-0.5 text-[10px]"
                step={0.1}
                placeholder="12"
              />
            </label>

            <label className="flex flex-col sm:order-4">
              <div className="text-xs text-muted mb-1 sm:hidden">Timing A</div>
              {h.type === "dry hop" ? (
                <select
                  className="w-full rounded-md border px-2 py-2.5"
                  value={h.dryHopStage ?? "primary"}
                  onChange={(e) =>
                    onUpdate(i, {
                      ...h,
                      dryHopStage: e.target.value as
                        | "primary"
                        | "post-fermentation"
                        | "keg",
                    })
                  }
                >
                  <option value="primary">Primary</option>
                  <option value="post-fermentation">Post-Fermentation</option>
                  <option value="keg">Keg</option>
                </select>
              ) : h.type === "whirlpool" ? (
                <InputWithSuffix
                  value={h.whirlpoolTempC ?? 80}
                  onChange={(n) => onUpdate(i, { ...h, whirlpoolTempC: n })}
                  suffix="°C"
                  suffixClassName="right-3 text-[10px]"
                  step={0.1}
                  placeholder="80"
                />
              ) : (
                <InputWithSuffix
                  value={h.timeMin ?? 0}
                  onChange={(n) => onUpdate(i, { ...h, timeMin: n })}
                  suffix=" min"
                  suffixClassName="right-3 text-[10px]"
                  step={1}
                  placeholder="60"
                />
              )}
            </label>

            {hasSecondTiming && (
              <label className="flex flex-col sm:order-5">
                <div className="text-xs text-muted mb-1 sm:hidden">
                  Timing B
                </div>
                {h.type === "dry hop" ? (
                  <InputWithSuffix
                    value={h.dryHopDays ?? 3}
                    onChange={(n) => onUpdate(i, { ...h, dryHopDays: n })}
                    suffix=" days"
                    suffixClassName="right-3 text-[10px]"
                    step={0.5}
                    placeholder="3"
                  />
                ) : h.type === "whirlpool" ? (
                  <InputWithSuffix
                    value={h.whirlpoolTimeMin ?? 15}
                    onChange={(n) => onUpdate(i, { ...h, whirlpoolTimeMin: n })}
                    suffix=" min"
                    suffixClassName="right-3 text-[10px]"
                    step={1}
                    placeholder="15"
                  />
                ) : (
                  <div className="h-10" />
                )}
              </label>
            )}

            <div className="flex justify-end items-center sm:order-7">
              <button
                className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
                onClick={() => onRemove(h.id)}
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
        );
      })}

      <button className="block sm:hidden w-full btn-neon" onClick={onAdd}>
        + Add Hop
      </button>
      <div className="flex justify-end mt-3 sm:mt-4">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-white/40 hover:bg_WHITE/20 shadow-lg shadow-black/30 hover:shadow-sm"
            onClick={onToggleVisualizer}
          >
            {showVisualizer ? "Hide Visualizer" : "Show Visualizer"}
          </button>
        </div>
      </div>
      <Collapsible open={showVisualizer}>
        {hopFlavorSeries.length > 0 && (
          <FlavorGraphs
            baseSeries={hopFlavorSeries}
            estFlavor={estimatedTotalFlavor}
          />
        )}
      </Collapsible>
    </section>
  );
}

export default HopSchedule;
