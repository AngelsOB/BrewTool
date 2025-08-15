import { useMemo, useState } from "react";
import {
  useRecipeStore,
  type GrainItem,
  type HopItem,
} from "../hooks/useRecipeStore";
import {
  abvSimple,
  mcuFromGrainBill,
  ogFromPoints,
  pointsFromGrainBill,
  srmMoreyFromMcu,
  srmToHex,
} from "../utils/calculations";
import {
  addCustomGrain,
  addCustomHop,
  getGrainPresets,
  getHopPresets,
} from "../utils/presets";

export default function RecipeBuilder() {
  const upsert = useRecipeStore((s) => s.upsert);
  const [name, setName] = useState("New Recipe");
  const [batchVolumeL, setBatchVolumeL] = useState(20);
  const [fg, setFg] = useState(1.01);
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

  const abv = useMemo(
    () =>
      abvSimple(ogFromPoints(pointsFromGrainBill(grains, batchVolumeL)), fg),
    [grains, batchVolumeL, fg]
  );
  const srm = useMemo(
    () => srmMoreyFromMcu(mcuFromGrainBill(grains, batchVolumeL)),
    [grains, batchVolumeL]
  );
  const og = useMemo(
    () => ogFromPoints(pointsFromGrainBill(grains, batchVolumeL)),
    [grains, batchVolumeL]
  );
  const color = useMemo(() => srmToHex(srm), [srm]);

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
            })
          }
        >
          Save Recipe
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <div className="rounded-lg border bg-emerald-500/10 px-4 py-3">
          <div className="text-sm text-neutral-700">Stats</div>
          <div className="text-sm text-white/70">ABV: {abv.toFixed(2)}%</div>
          <div className="text-sm text-white/70">
            Color (SRM): {srm.toFixed(1)}
          </div>
          <div className="text-sm text-white/70">OG: {og.toFixed(3)}</div>
          <div
            className="h-6 w-24 rounded mt-1"
            style={{ backgroundColor: color }}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-medium">Grain Bill</div>
        <div className="hidden sm:grid grid-cols-4 gap-2 text-xs text-white/60">
          <div>Grain</div>
          <div>Weight (kg)</div>
          <div>Color (°L)</div>
          <div>Yield (%)</div>
        </div>
        {grains.map((g, i) => (
          <div key={g.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">Grain</div>
              <select
                className="w-full rounded-md border px-2"
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
                className="rounded-md border px-3 py-2"
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
          </div>
        ))}
        <button
          className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
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
        <div className="font-medium">Hop Schedule</div>
        <div className="hidden sm:grid grid-cols-4 gap-2 text-xs text-white/60">
          <div>Hop</div>
          <div>Grams</div>
          <div>Alpha %</div>
          <div>Time (min)</div>
        </div>
        {hops.map((h, i) => (
          <div
            key={h.id ?? i}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2"
          >
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">Hop</div>
              <select
                className="w-full rounded-md border px-2"
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
                    } as HopItem;
                    setHops(c);
                    setShowCustomHopInput(false);
                  }
                }}
                defaultValue=""
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
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">Grams</div>
              <input
                className="rounded-md border px-3 py-2"
                type="number"
                step="0.1"
                placeholder="Grams"
                value={h.grams}
                onChange={(e) => {
                  const c = [...hops];
                  c[i] = { ...h, grams: Number(e.target.value) } as HopItem;
                  setHops(c);
                }}
              />
            </label>
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">
                Alpha %
              </div>
              <input
                className="rounded-md border px-3 py-2"
                type="number"
                step="0.1"
                placeholder="Alpha %"
                value={h.alphaAcidPercent}
                onChange={(e) => {
                  const c = [...hops];
                  c[i] = {
                    ...h,
                    alphaAcidPercent: Number(e.target.value),
                  } as HopItem;
                  setHops(c);
                }}
              />
            </label>
            <label className="flex flex-col">
              <div className="text-xs text-white/60 mb-1 sm:hidden">
                Time (min)
              </div>
              <input
                className="rounded-md border px-3 py-2"
                type="number"
                step="1"
                placeholder="Time (min)"
                value={h.timeMin}
                onChange={(e) => {
                  const c = [...hops];
                  c[i] = { ...h, timeMin: Number(e.target.value) } as HopItem;
                  setHops(c);
                }}
              />
            </label>
          </div>
        ))}
        <button
          className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
          onClick={() =>
            setHops((hs) => [
              ...hs,
              {
                id: crypto.randomUUID(),
                name: "",
                grams: 0,
                alphaAcidPercent: 0,
                timeMin: 60,
              },
            ])
          }
        >
          + Add Hop
        </button>
      </section>
    </div>
  );
}
