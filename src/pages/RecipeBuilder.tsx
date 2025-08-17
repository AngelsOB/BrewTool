import { useMemo, useState } from "react";
import {
  useRecipeStore,
  type GrainItem,
  type HopItem,
  type HopTimingType,
  type YeastItem,
} from "../hooks/useRecipeStore";
import {
  abvSimple,
  mcuFromGrainBill,
  ogFromPoints,
  pointsFromGrainBill,
  srmMoreyFromMcu,
  srmToHex,
} from "../utils/calculations";
import { ibuTotal } from "../calculators/ibu";
import HopFlavorRadar from "../components/HopFlavorRadar";
import InputWithSuffix from "../components/InputWithSuffix";
import InlineEditableNumber from "../components/InlineEditableNumber";
import { estimateRecipeHopFlavor } from "../utils/hopsFlavor";
import {
  addCustomGrain,
  addCustomHop,
  getGrainPresets,
  getHopPresets,
  getYeastPresets,
} from "../utils/presets";

export default function RecipeBuilder() {
  const upsert = useRecipeStore((s) => s.upsert);
  const [name, setName] = useState("New Recipe");
  const [batchVolumeL, setBatchVolumeL] = useState(20);
  const [fg, setFg] = useState(1.01);
  const [efficiencyPct, setEfficiencyPct] = useState(72); // brewhouse efficiency percentage
  const [grains, setGrains] = useState<GrainItem[]>([
    {
      id: crypto.randomUUID(),
      name: "Pale Malt",
      weightKg: 4,
      colorLovibond: 2,
      yield: 0.75,
    },
  ]);
  const [hops, setHops] = useState<HopItem[]>([]);
  const [yeast, setYeast] = useState<YeastItem>({
    name: "SafAle US-05",
    attenuationPercent: 0.78,
  });
  const [showCustomGrainInput, setShowCustomGrainInput] = useState(false);
  const [showCustomHopInput, setShowCustomHopInput] = useState(false);

  const sortedHopPresets = useMemo(() => {
    const presets = getHopPresets();
    const categories = Array.from(
      new Set(presets.map((p) => p.category))
    ).filter(Boolean) as string[];
    categories.sort((a, b) => a.localeCompare(b));

    const grouped: Record<string, typeof presets> = {};
    categories.forEach((cat) => (grouped[cat] = []));

    // Ensure 'Other' category exists for hops without a category
    if (!grouped["Other"]) {
      grouped["Other"] = [];
    }

    presets.forEach((p) => {
      if (p.category) {
        grouped[p.category].push(p);
      } else {
        grouped["Other"].push(p);
      }
    });

    // Sort hops within each category alphabetically
    for (const category in grouped) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, []);

  const sortedYeastPresets = useMemo(() => {
    const presets = getYeastPresets();
    const categories = Array.from(
      new Set(presets.map((p) => p.category))
    ).filter(Boolean) as string[];
    categories.sort((a, b) => a.localeCompare(b));

    const grouped: Record<string, typeof presets> = {};
    categories.forEach((cat) => (grouped[cat] = []));

    // Ensure 'Other' category exists for yeasts without a category
    if (!grouped["Other"]) {
      grouped["Other"] = [];
    }

    presets.forEach((p) => {
      if (p.category) {
        grouped[p.category].push(p);
      } else {
        grouped["Other"].push(p);
      }
    });

    // Sort yeasts within each category alphabetically
    for (const category in grouped) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, []);

  const abv = useMemo(
    () =>
      abvSimple(
        ogFromPoints(
          pointsFromGrainBill(
            grains.map((g) => ({ weightKg: g.weightKg, yield: g.yield })),
            batchVolumeL,
            efficiencyPct / 100
          )
        ),
        fg
      ),
    [grains, batchVolumeL, fg, efficiencyPct]
  );
  const srm = useMemo(
    () => srmMoreyFromMcu(mcuFromGrainBill(grains, batchVolumeL)),
    [grains, batchVolumeL]
  );
  const og = useMemo(
    () =>
      ogFromPoints(
        pointsFromGrainBill(
          grains.map((g) => ({ weightKg: g.weightKg, yield: g.yield })),
          batchVolumeL,
          efficiencyPct / 100
        )
      ),
    [grains, batchVolumeL, efficiencyPct]
  );
  const color = useMemo(() => srmToHex(srm), [srm]);

  const ibu = useMemo(
    () =>
      ibuTotal(
        hops.map((h) => ({
          weightGrams: h.grams,
          alphaAcidPercent: h.alphaAcidPercent,
          boilTimeMinutes: h.timeMin,
          type: h.type,
        })),
        batchVolumeL,
        og
      ),
    [hops, batchVolumeL, og]
  );

  // (kept inlined where used to avoid dead code)

  // Collect distinct hop flavor series (all)
  const hopFlavorSeries = useMemo(() => {
    const seen = new Set<string>();
    const series: { name: string; flavor: NonNullable<HopItem["flavor"]> }[] =
      [];
    for (const h of hops) {
      if (!h.name || !h.flavor || seen.has(h.name)) continue;
      seen.add(h.name);
      series.push({ name: h.name, flavor: h.flavor });
    }
    return series;
  }, [hops]);

  const estimatedTotalFlavor = useMemo(
    () => estimateRecipeHopFlavor(hops, batchVolumeL),
    [hops, batchVolumeL]
  );

  const hasSecondTiming = useMemo(
    () => hops.some((x) => x.type === "dry hop" || x.type === "whirlpool"),
    [hops]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Recipe Builder
          </h1>
          <p className="mt-1 text-white/70 text-sm">
            Inline stats update as you type.
          </p>
        </div>
        <button
          className="btn-neon"
          onClick={() =>
            upsert({
              id: crypto.randomUUID(),
              name,
              createdAt: new Date().toISOString(),
              batchVolumeL,
              targetOG: og,
              targetFG: fg,
              grains,
              hops,
              yeast,
            })
          }
        >
          Save Recipe
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">Name</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">Batch Volume (L)</div>
          <input
            type="number"
            step="0.1"
            className="w-full rounded-md border px-3 py-2"
            value={batchVolumeL}
            onChange={(e) => setBatchVolumeL(Number(e.target.value))}
          />
        </label>
        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">Efficiency (%)</div>
          <input
            type="number"
            step="1"
            min="40"
            max="95"
            className="w-full rounded-md border px-3 py-2"
            value={efficiencyPct}
            onChange={(e) => setEfficiencyPct(Number(e.target.value))}
          />
        </label>
        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">OG / FG</div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.001"
              min="1.000"
              max="1.2"
              className="w-full rounded-md border px-3 py-2"
              value={og.toFixed(3)}
              placeholder="1.050"
              readOnly
            />
            <input
              type="number"
              step="0.001"
              min="0.990"
              max="1.2"
              className="w-full rounded-md border px-3 py-2"
              value={fg}
              onChange={(e) => setFg(Number(e.target.value))}
              placeholder="1.010"
            />
          </div>
        </label>
      </section>

      {/* Sticky summary bar (glass + warm accent) */}
      <div className="sticky top-14 z-10 mx-auto max-w-6xl py-2 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/40 px-3 py-2 shadow-soft ring-1 ring-neutral-900/5 supports-[backdrop-filter]:bg-white/25">
          <div className="text-sm font-medium tracking-tight text-white/50">
            Recipe Summary
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft">
              <span className="text-neutral-600">OG</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {og.toFixed(3)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft">
              <span className="text-neutral-600">ABV</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {abv.toFixed(2)}%
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft">
              <span className="text-neutral-600">SRM</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {srm.toFixed(1)}
              </span>
              <span
                className="h-4 w-8 shrink-0 rounded-md border border-white/20"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft">
              <span className="text-neutral-600">IBU</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {ibu.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-medium">Grain Bill</div>
          <button
            className="hidden sm:block btn-neon"
            onClick={() =>
              setGrains((gs) => [
                ...gs,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  weightKg: 0,
                  colorLovibond: 2,
                  yield: 0.75,
                },
              ])
            }
          >
            + Add Grain
          </button>
        </div>
        <div className="hidden sm:grid grid-cols-5 gap-2 text-xs text-white/60">
          <div>Grain</div>
          <div>Weight (kg)</div>
          <div>Color (°L)</div>
          <div>Yield (%)</div>
          <div></div> {/* For the remove button */}
        </div>
        {grains.map((g, i) => (
          <div
            key={g.id}
            className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content] gap-2"
          >
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">Grain</div>
              <select
                className="w-full rounded-md border px-2 py-2.5"
                onChange={(e) => {
                  if (e.target.value === "__add_custom__") {
                    setShowCustomGrainInput(true);
                    // Optionally reset the current grain item or set a placeholder
                  } else {
                    const preset = getGrainPresets().find(
                      (p) => p.name === e.target.value
                    );
                    if (!preset) return;
                    const c = [...grains];
                    c[i] = {
                      ...g,
                      name: preset.name,
                      colorLovibond: preset.colorLovibond,
                      yield: preset.yield,
                    };
                    setGrains(c);
                    setShowCustomGrainInput(false);
                  }
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
            </label>
            {showCustomGrainInput && (
              <form
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 col-span-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement & {
                    gname: HTMLInputElement;
                    glov: HTMLInputElement;
                    gyield: HTMLInputElement;
                  };
                  const name = form.gname.value.trim();
                  const lov = Number(form.glov.value);
                  const grainYield = Number(form.gyield.value);
                  if (
                    !name ||
                    !Number.isFinite(lov) ||
                    !Number.isFinite(grainYield)
                  )
                    return;
                  addCustomGrain({
                    name,
                    colorLovibond: lov,
                    yield: grainYield,
                  });
                  form.reset();
                  setShowCustomGrainInput(false);
                }}
              >
                <input
                  name="gname"
                  className="rounded-md border px-3 py-2"
                  placeholder="Grain name"
                />
                <input
                  name="glov"
                  type="number"
                  step="0.1"
                  className="rounded-md border px-3 py-2"
                  placeholder="Color °L"
                />
                <input
                  name="gyield"
                  type="number"
                  step="0.01"
                  className="rounded-md border px-3 py-2"
                  placeholder="Yield %"
                />
                <button
                  className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
                  type="submit"
                >
                  + Add Grain Preset
                </button>
              </form>
            )}
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">
                Weight (kg)
              </div>
              <input
                className="rounded-md border px-3 py-2"
                type="number"
                step="0.01"
                placeholder="Weight (kg)"
                value={g.weightKg}
                onChange={(e) => {
                  const c = [...grains];
                  c[i] = { ...g, weightKg: Number(e.target.value) };
                  setGrains(c);
                }}
              />
            </label>
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">
                Color (°L)
              </div>
              <input
                className="rounded-md border px-3 py-2"
                type="number"
                step="0.1"
                placeholder="Color °L"
                value={g.colorLovibond}
                onChange={(e) => {
                  const c = [...grains];
                  c[i] = { ...g, colorLovibond: Number(e.target.value) };
                  setGrains(c);
                }}
              />
            </label>
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">
                Yield (%)
              </div>
              <input
                className="rounded-md border px-3 py-2 w-full"
                type="number"
                step="0.01"
                placeholder="Yield %"
                value={g.yield}
                onChange={(e) => {
                  const c = [...grains];
                  c[i] = { ...g, yield: Number(e.target.value) };
                  setGrains(c);
                }}
              />
            </label>
            <div className="flex justify-end items-center">
              <button
                className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
                onClick={() =>
                  setGrains((currentGrains) =>
                    currentGrains.filter((grain) => grain.id !== g.id)
                  )
                }
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
        <button
          className="block sm:hidden w-full btn-neon"
          onClick={() =>
            setGrains((gs) => [
              ...gs,
              {
                id: crypto.randomUUID(),
                name: "",
                weightKg: 0,
                colorLovibond: 2,
                yield: 0.75,
              },
            ])
          }
        >
          + Add Grain
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-medium">Hop Schedule</div>
          <button
            className="hidden sm:block btn-neon"
            onClick={() =>
              setHops((hs) => [
                ...hs,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  grams: 0,
                  alphaAcidPercent: 0,
                  timeMin: 60,
                  type: "boil", // Default to 'boil'
                },
              ])
            }
          >
            + Add Hop
          </button>
        </div>
        <div
          className={
            "hidden sm:grid gap-2 text-xs text-white/60 " +
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
          <div></div> {/* For the remove button */}
        </div>
        {hops.map((h, i) => (
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
              <div className="text-xs text-white/60 mb-1 sm:hidden">Hop</div>
              <select
                className="w-full rounded-md border px-2 py-2.5"
                onChange={(e) => {
                  if (e.target.value === "__add_custom__") {
                    setShowCustomHopInput(true);
                  } else {
                    const preset = getHopPresets().find(
                      (p) => p.name === e.target.value
                    );
                    if (!preset) return;
                    const c = [...hops];
                    c[i] = {
                      ...h,
                      name: preset.name,
                      alphaAcidPercent: preset.alphaAcidPercent,
                      category: preset.category, // Set the category here
                      flavor: preset.flavor,
                    } as HopItem;
                    setHops(c);
                    setShowCustomHopInput(false);
                  }
                }}
                defaultValue={h.name}
              >
                <option value="" disabled>
                  Hops...
                </option>
                {Object.entries(sortedHopPresets).map(
                  ([category, hopsInCat]) => (
                    <optgroup key={category} label={category}>
                      {hopsInCat.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                )}
                <option value="__add_custom__">+ Add Custom Hop</option>
              </select>
            </label>
            <label className="flex flex-col sm:order-3">
              <div className="text-xs text-white/60 mb-1 sm:hidden">Type</div>
              <select
                className="w-full rounded-md border px-2 py-2.5"
                value={h.type}
                onChange={(e) => {
                  const c = [...hops];
                  c[i] = { ...h, type: e.target.value as HopTimingType };
                  setHops(c);
                }}
              >
                <option value="boil">Boil</option>
                <option value="dry hop">Dry Hop</option>
                <option value="whirlpool">Whirlpool</option>
                <option value="first wort">First Wort</option>
                <option value="mash">Mash</option>
              </select>
            </label>
            {/* Grams (moved up to match header order) */}
            <label className="flex flex-col sm:order-6">
              <div className="text-xs text-white/60 mb-1 sm:hidden">Grams</div>
              <InputWithSuffix
                value={h.grams}
                onChange={(n) => {
                  const c = [...hops];
                  c[i] = { ...h, grams: n } as HopItem;
                  setHops(c);
                }}
                suffix=" g"
                suffixClassName="right-3 text-[10px]"
                step={0.1}
                placeholder="10"
              />
            </label>
            {/* Alpha % (moved up to match header order) */}
            <label className="flex flex-col sm:order-2">
              <div className="text-xs text-white/60 mb-1 sm:hidden">
                Alpha %
              </div>
              <InlineEditableNumber
                value={h.alphaAcidPercent}
                onChange={(n) => {
                  const c = [...hops];
                  c[i] = { ...h, alphaAcidPercent: n } as HopItem;
                  setHops(c);
                }}
                suffix="%"
                suffixClassName="left-9 right-0.5 text-[10px]"
                step={0.1}
                placeholder="12"
              />
            </label>
            {/* Timing A column */}
            <label className="flex flex-col sm:order-4">
              <div className="text-xs text-white/60 mb-1 sm:hidden">
                Timing A
              </div>
              {h.type === "dry hop" ? (
                <select
                  className="w-full rounded-md border px-2 py-2.5"
                  value={h.dryHopStage ?? "primary"}
                  onChange={(e) => {
                    const c = [...hops];
                    c[i] = {
                      ...h,
                      dryHopStage: e.target.value as
                        | "primary"
                        | "post-fermentation"
                        | "keg",
                    } as HopItem;
                    setHops(c);
                  }}
                >
                  <option value="primary">Primary</option>
                  <option value="post-fermentation">Post-Fermentation</option>
                  <option value="keg">Keg</option>
                </select>
              ) : h.type === "whirlpool" ? (
                <InputWithSuffix
                  value={h.whirlpoolTempC ?? 80}
                  onChange={(n) => {
                    const c = [...hops];
                    c[i] = { ...h, whirlpoolTempC: n } as HopItem;
                    setHops(c);
                  }}
                  suffix="°C"
                  suffixClassName="right-3 text-[10px]"
                  step={0.1}
                  placeholder="80"
                />
              ) : (
                <InputWithSuffix
                  value={h.timeMin ?? 0}
                  onChange={(n) => {
                    const c = [...hops];
                    c[i] = { ...h, timeMin: n } as HopItem;
                    setHops(c);
                  }}
                  suffix=" min"
                  suffixClassName="right-3 text-[10px]"
                  step={1}
                  placeholder="60"
                />
              )}
            </label>

            {/* Timing B column (only when grid includes it) */}
            {hasSecondTiming && (
              <label className="flex flex-col sm:order-5">
                <div className="text-xs text-white/60 mb-1 sm:hidden">
                  Timing B
                </div>
                {h.type === "dry hop" ? (
                  <InputWithSuffix
                    value={h.dryHopDays ?? 3}
                    onChange={(n) => {
                      const c = [...hops];
                      c[i] = { ...h, dryHopDays: n } as HopItem;
                      setHops(c);
                    }}
                    suffix=" days"
                    suffixClassName="right-3 text-[10px]"
                    step={0.5}
                    placeholder="3"
                  />
                ) : h.type === "whirlpool" ? (
                  <InputWithSuffix
                    value={h.whirlpoolTimeMin ?? 15}
                    onChange={(n) => {
                      const c = [...hops];
                      c[i] = { ...h, whirlpoolTimeMin: n } as HopItem;
                      setHops(c);
                    }}
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
            {/* Remove generic time input; handled contextually above */}
            <div className="flex justify-end items-center sm:order-7">
              <button
                className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
                onClick={() =>
                  setHops((currentHops) =>
                    currentHops.filter((hop) => hop.id !== h.id)
                  )
                }
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
            {showCustomHopInput && (
              <form
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 col-span-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement & {
                    hname: HTMLInputElement;
                    haa: HTMLInputElement;
                  };
                  const name = form.hname.value.trim();
                  const aa = Number(form.haa.value);
                  if (!name || !Number.isFinite(aa)) return;
                  addCustomHop({ name, alphaAcidPercent: aa });
                  form.reset();
                  setShowCustomHopInput(false);
                }}
              >
                <input
                  name="hname"
                  className="rounded-md border px-3 py-2"
                  placeholder="Hop name"
                />
                <input
                  name="haa"
                  type="number"
                  step="0.1"
                  className="rounded-md border px-3 py-2"
                  placeholder="Alpha %"
                />
                <button
                  className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
                  type="submit"
                >
                  + Add Hop Preset
                </button>
              </form>
            )}
          </div>
        ))}
        <button
          className="block sm:hidden w-full btn-neon"
          onClick={() =>
            setHops((hs) => [
              ...hs,
              {
                id: crypto.randomUUID(),
                name: "",
                grams: 0,
                alphaAcidPercent: 0,
                timeMin: 60,
                type: "boil",
              },
            ])
          }
        >
          + Add Hop
        </button>
      </section>

      {hopFlavorSeries.length > 0 && (
        <FlavorGraphs
          baseSeries={hopFlavorSeries}
          estFlavor={estimatedTotalFlavor}
        />
      )}

      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-medium">Yeast</div>
          <button
            className="p-1 text-neutral-400 hover:text-red-500 transition w-fit ml-auto self-end"
            onClick={() =>
              setYeast({
                name: "",
                attenuationPercent: undefined,
              })
            }
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
        <label className="flex flex-col">
          <select
            className="w-full rounded-md border px-2 py-2.5"
            value={yeast.name}
            onChange={(e) => {
              const preset = getYeastPresets().find(
                (p) => p.name === e.target.value
              );
              if (!preset) return;
              setYeast(preset);
            }}
          >
            <option value="" disabled>
              Select Yeast...
            </option>
            {Object.entries(sortedYeastPresets).map(
              ([category, yeastsInCat]) => (
                <optgroup key={category} label={category}>
                  {yeastsInCat.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )
            )}
          </select>
        </label>
        {yeast.attenuationPercent && (
          <div className="text-sm text-neutral-600">
            Est. Attenuation: {(yeast.attenuationPercent * 100).toFixed(0)}%
          </div>
        )}
      </section>
    </div>
  );
}

function FlavorGraphs({
  baseSeries,
  estFlavor,
}: {
  baseSeries: { name: string; flavor: NonNullable<HopItem["flavor"]> }[];
  estFlavor: NonNullable<HopItem["flavor"]>;
}) {
  const [mode, setMode] = useState<"base" | "estimated">("base");
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">Hop Flavor Profile</div>
        <div className="flex items-center gap-2 text-sm">
          <button
            className={`rounded-md px-2 py-1 border ${
              mode === "base" ? "bg-white/80" : "bg-white/30"
            }`}
            onClick={() => setMode("base")}
          >
            Preset
          </button>
          <button
            className={`rounded-md px-2 py-1 border ${
              mode === "estimated" ? "bg-white/80" : "bg-white/30"
            }`}
            onClick={() => setMode("estimated")}
          >
            Estimated
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 p-3 shadow-soft">
        {mode === "base" ? (
          <HopFlavorRadar
            title="Base hop profiles"
            emptyHint="Pick hops with flavor data"
            series={baseSeries}
          />
        ) : (
          <HopFlavorRadar
            title="Estimated final aroma emphasis"
            emptyHint="Increase dose or add late/dry hops"
            series={[{ name: "Total (est.)", flavor: estFlavor }]}
          />
        )}
      </div>
    </section>
  );
}
