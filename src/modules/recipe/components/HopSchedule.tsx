import { useState } from "react";
import InputWithSuffix from "../../../components/InputWithSuffix";
import DualUnitInput from "../../../components/DualUnitInput";
import InlineEditableNumber from "../../../components/InlineEditableNumber";
import Collapsible from "../../../components/Collapsible";
import FlavorGraphs from "../../../components/FlavorGraphs";
import type { HopItem, HopTimingType } from "../types";
import {
  addCustomHop,
  getHopPresets,
  HOP_FLAVOR_KEYS,
  type HopFlavorProfile,
} from "../../../utils/presets";
import { ibuSingleAddition } from "../../../calculators/ibu";
import SearchSelect from "../../../components/SearchSelect";

export function HopSchedule({
  hops,
  batchVolumeL,
  ogUsed,
  hasSecondTiming,
  onAdd,
  onUpdate,
  onRemove,
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
  showVisualizer: boolean;
  onToggleVisualizer: () => void;
  hopFlavorSeries: { name: string; flavor: NonNullable<HopItem["flavor"]> }[];
  estimatedTotalFlavor: NonNullable<HopItem["flavor"]>;
}) {
  const [savedCustomHop, setSavedCustomHop] = useState<
    Record<string, "idle" | "saved" | "done">
  >({});
  // no local refs needed for modal-based custom entry
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customIndex, setCustomIndex] = useState<number | null>(null);
  const [newHopDraft, setNewHopDraft] = useState<{
    name: string;
    alphaAcidPercent: number;
    category?: string;
    flavor?: Record<string, number>;
  }>({
    name: "",
    alphaAcidPercent: 10,
    category: "",
    flavor: {},
  });
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
              {h.customNameLocked ? (
                <>
                  <input
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="Custom hop name"
                    value={h.name}
                    onChange={(e) =>
                      onUpdate(i, { ...h, name: e.target.value })
                    }
                  />
                  <div className="mt-1">
                    {savedCustomHop[h.id] === "saved" ? (
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
                    {savedCustomHop[h.id] !== "done" &&
                      savedCustomHop[h.id] !== "saved" && (
                        <button
                          type="button"
                          title="Save preset"
                          className="rounded border px-2 py-1 text-[10px] text-neutral-700 hover:bg-white/70 bg-white/50 inline-flex items-center gap-2"
                          onClick={() => {
                            const name = (h.name || "").trim();
                            if (!name) return;
                            addCustomHop({
                              name,
                              alphaAcidPercent: Number(h.alphaAcidPercent) || 0,
                              category: h.category,
                            });
                            setSavedCustomHop((prev) => ({
                              ...prev,
                              [h.id]: "saved",
                            }));
                            onUpdate(i, {
                              ...h,
                              name,
                              customNameLocked: false,
                              customNameSelected: false,
                            });
                            window.setTimeout(() => {
                              setSavedCustomHop((prev) => ({
                                ...prev,
                                [h.id]: "done",
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
                    const presets = getHopPresets();
                    const options = presets.map((p) => ({
                      label: p.name,
                      value: p.name,
                    }));
                    const byCategory = new Map<
                      string,
                      {
                        label: string;
                        options: { label: string; value: string }[];
                      }
                    >();
                    for (const p of presets) {
                      const cat =
                        (p as { category?: string }).category || "Other";
                      if (!byCategory.has(cat))
                        byCategory.set(cat, { label: cat, options: [] });
                      byCategory
                        .get(cat)!
                        .options.push({ label: p.name, value: p.name });
                    }
                    options.push({
                      label: "Custom hop...",
                      value: "__add_custom__",
                    });
                    const groups = Array.from(byCategory.values());
                    groups.push({
                      label: "Custom",
                      options: [
                        { label: "Custom hop...", value: "__add_custom__" },
                      ],
                    });
                    return (
                      <SearchSelect
                        value={h.name}
                        options={options}
                        groups={groups}
                        placeholder="Hops... type to search"
                        onChange={(value) => {
                          if (value === "__add_custom__") {
                            setCustomIndex(i);
                            setNewHopDraft({
                              name: (h.name || "").trim(),
                              alphaAcidPercent: h.alphaAcidPercent || 10,
                            });
                            setShowCustomModal(true);
                            return;
                          }
                          const preset = getHopPresets().find(
                            (p) => p.name === value
                          );
                          if (preset) {
                            onUpdate(i, {
                              ...h,
                              name: preset.name,
                              alphaAcidPercent: preset.alphaAcidPercent,
                              category: preset.category,
                              flavor: preset.flavor,
                              customNameSelected: false,
                              customNameLocked: false,
                            } as HopItem);
                          } else {
                            // Update to typed value so the input reflects user typing
                            onUpdate(i, {
                              ...h,
                              name: value,
                              customNameSelected: true,
                              customNameLocked: false,
                            });
                          }
                        }}
                        onCreate={(q) => {
                          setCustomIndex(i);
                          setNewHopDraft({
                            name: (q || "").trim(),
                            alphaAcidPercent: 10,
                          });
                          setShowCustomModal(true);
                        }}
                      />
                    );
                  })()}
                </>
              )}
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
              <div className="text-xs text-muted mb-1 sm:hidden">Amount</div>
              <DualUnitInput
                value={h.grams}
                onChange={(n: number) => onUpdate(i, { ...h, grams: n })}
                unitType="weightSmall"
                step={0.1}
                placeholder="10"
              />
            </label>

            <label className="flex flex-col sm:order-2">
              <div className="text-xs text-muted mb-1 sm:hidden">Alpha %</div>
              <InlineEditableNumber
                value={h.alphaAcidPercent}
                onChange={(n: number) =>
                  onUpdate(i, { ...h, alphaAcidPercent: n })
                }
                suffix="%"
                suffixClassName="left-9 right-0.5 text-[10px]"
                step={0.1}
                placeholder="12"
              />
            </label>

            <label className="flex flex-col sm:order-4">
              <div className="text-xs text-muted mb-1 sm:hidden">Timing A</div>
              {h.type === "dry hop" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted shrink-0">on</span>
                  <InputWithSuffix
                    value={h.dryHopStartDay ?? 0}
                    onChange={(n: number) =>
                      onUpdate(i, {
                        ...h,
                        dryHopStartDay: Math.max(0, n),
                      })
                    }
                    suffix=" day"
                    suffixClassName="right-25 text-[10px]"
                    step={0.5}
                    placeholder="On day"
                  />
                </div>
              ) : h.type === "whirlpool" ? (
                <DualUnitInput
                  value={h.whirlpoolTempC ?? 80}
                  onChange={(n: number) =>
                    onUpdate(i, { ...h, whirlpoolTempC: n })
                  }
                  unitType="temperature"
                  step={0.1}
                  placeholder="80"
                />
              ) : (
                <InputWithSuffix
                  value={h.timeMin ?? 0}
                  onChange={(n: number) => onUpdate(i, { ...h, timeMin: n })}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted shrink-0">for</span>
                    <InputWithSuffix
                      value={h.dryHopDays ?? 3}
                      onChange={(n: number) =>
                        onUpdate(i, { ...h, dryHopDays: n })
                      }
                      suffix=" days"
                      suffixClassName="right-3 text-[10px]"
                      step={0.5}
                      placeholder="For days"
                    />
                  </div>
                ) : h.type === "whirlpool" ? (
                  <InputWithSuffix
                    value={h.whirlpoolTimeMin ?? 15}
                    onChange={(n: number) =>
                      onUpdate(i, { ...h, whirlpoolTimeMin: n })
                    }
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
      {showCustomModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCustomModal(false)}
          />
          <div className="relative z-50 w-full max-w-md rounded-lg border border-white/15 bg-black/20 backdrop-blur p-4 shadow-xl">
            <div className="text-sm font-semibold mb-3">Add new hop?</div>
            <div className="space-y-2">
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Hop name"
                value={newHopDraft.name}
                onChange={(e) =>
                  setNewHopDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <div className="grid grid-cols-1 gap-2">
                <InputWithSuffix
                  value={newHopDraft.alphaAcidPercent}
                  onChange={(n: number) =>
                    setNewHopDraft((d) => ({ ...d, alphaAcidPercent: n }))
                  }
                  suffix=" % AA"
                  suffixClassName="right-2 text-[10px]"
                  step={0.1}
                  placeholder="10.0"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <input
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Category (optional)"
                  value={newHopDraft.category ?? ""}
                  onChange={(e) =>
                    setNewHopDraft((d) => ({ ...d, category: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(HOP_FLAVOR_KEYS as unknown as string[]).map((k) => (
                  <label key={k} className="text-xs text-muted">
                    <div className="mb-1 capitalize">
                      {k.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={newHopDraft.flavor?.[k] ?? 0}
                      onChange={(e) => {
                        const v = Math.max(
                          0,
                          Math.min(5, Number(e.target.value) || 0)
                        );
                        setNewHopDraft((d) => ({
                          ...d,
                          flavor: { ...(d.flavor || {}), [k]: v },
                        }));
                      }}
                    />
                  </label>
                ))}
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
                    const name = newHopDraft.name.trim();
                    if (!name) return;
                    const idx = customIndex ?? 0;
                    const current = hops[idx];
                    const flavor: HopFlavorProfile | undefined = (() => {
                      const f = newHopDraft.flavor;
                      if (!f || Object.keys(f).length === 0) return undefined;
                      return {
                        citrus: f.citrus ?? 0,
                        tropicalFruit: f.tropicalFruit ?? 0,
                        stoneFruit: f.stoneFruit ?? 0,
                        berry: f.berry ?? 0,
                        floral: f.floral ?? 0,
                        grassy: f.grassy ?? 0,
                        herbal: f.herbal ?? 0,
                        spice: f.spice ?? 0,
                        resinPine: f.resinPine ?? 0,
                      } as HopFlavorProfile;
                    })();
                    addCustomHop({
                      name,
                      alphaAcidPercent:
                        Number(newHopDraft.alphaAcidPercent) || 0,
                      category:
                        (newHopDraft.category || current?.category) ??
                        undefined,
                      flavor,
                    });
                    onUpdate(idx, {
                      ...current,
                      name,
                      alphaAcidPercent:
                        Number(newHopDraft.alphaAcidPercent) || 0,
                      category:
                        (newHopDraft.category || current?.category) ??
                        current?.category,
                      flavor: flavor ?? current.flavor,
                      customNameSelected: false,
                      customNameLocked: false,
                    } as HopItem);
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
      <Collapsible open={showVisualizer}>
        <FlavorGraphs
          baseSeries={hopFlavorSeries}
          estFlavor={estimatedTotalFlavor}
        />
      </Collapsible>
    </section>
  );
}

export default HopSchedule;
