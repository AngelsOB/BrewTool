import { useMemo, useState } from "react";
import {
  useRecipeStore,
  type GrainItem,
  type HopItem,
} from "../hooks/useRecipeStore";
import {
  abvSimple,
  mcuFromGrainBill,
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
  const [og, setOg] = useState(1.05);
  const [fg, setFg] = useState(1.01);
  const [grains, setGrains] = useState<GrainItem[]>([
    {
      id: crypto.randomUUID(),
      name: "Pale Malt",
      weightKg: 4,
      colorLovibond: 2,
    },
  ]);
  const [hops, setHops] = useState<HopItem[]>([]);

  const abv = useMemo(() => abvSimple(og, fg), [og, fg]);
  const srm = useMemo(
    () => srmMoreyFromMcu(mcuFromGrainBill(grains, batchVolumeL)),
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
              value={og}
              onChange={(e) => setOg(Number(e.target.value))}
              placeholder="1.050"
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
          <div
            className="h-6 w-24 rounded mt-1"
            style={{ backgroundColor: color }}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-medium">Grain Bill</div>
        <div className="hidden sm:grid grid-cols-3 gap-2 text-xs text-white/60">
          <div>Grain</div>
          <div>Weight (kg)</div>
          <div>Color (°L)</div>
        </div>
        {grains.map((g, i) => (
          <div key={g.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="text-xs text-white/60 sm:hidden">Grain</div>
            <div className="flex gap-2 min-w-0">
              <select
                className="w-full rounded-md border px-2"
                onChange={(e) => {
                  const preset = getGrainPresets().find(
                    (p) => p.name === e.target.value
                  );
                  if (!preset) return;
                  const c = [...grains];
                  c[i] = {
                    ...g,
                    name: preset.name,
                    colorLovibond: preset.colorLovibond,
                  };
                  setGrains(c);
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
              </select>
            </div>
            <div className="text-xs text-white/60 sm:hidden">Weight (kg)</div>
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
            <div className="text-xs text-white/60 sm:hidden">Color (°L)</div>
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
            <div className="text-xs text-white/60 sm:hidden">Hop</div>
            <div className="flex gap-2 min-w-0">
              <select
                className="w-full rounded-md border px-2"
                onChange={(e) => {
                  const preset = getHopPresets().find(
                    (p) => p.name === e.target.value
                  );
                  if (!preset) return;
                  const c = [...hops];
                  c[i] = {
                    ...h,
                    name: preset.name,
                    alphaAcidPercent: preset.alphaAcidPercent,
                  } as HopItem;
                  setHops(c);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Hops...
                </option>
                {getHopPresets().map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-white/60 sm:hidden">Grams</div>
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
            <div className="text-xs text-white/60 sm:hidden">Alpha %</div>
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
            <div className="text-xs text-white/60 sm:hidden">Time (min)</div>
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

      <section className="space-y-2">
        <div className="font-medium">Add Custom Grain Preset</div>
        <form
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement & {
              gname: HTMLInputElement;
              glov: HTMLInputElement;
            };
            const name = form.gname.value.trim();
            const lov = Number(form.glov.value);
            if (!name || !Number.isFinite(lov)) return;
            addCustomGrain({ name, colorLovibond: lov });
            form.reset();
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
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
            type="submit"
          >
            + Add Grain Preset
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <div className="font-medium">Add Custom Hop Preset</div>
        <form
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
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
      </section>

      <section className="space-y-3">
        <div className="font-medium">Hop Schedule (preview)</div>
        {hops.length === 0 ? (
          <div className="text-sm text-white/70">No hops yet.</div>
        ) : (
          hops.map((h, i) => (
            <div
              key={h.id ?? i}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <input
                className="rounded-md border px-3 py-2"
                placeholder="Name"
                value={h.name}
                onChange={(e) => {
                  const c = [...hops];
                  c[i] = { ...h, name: e.target.value } as HopItem;
                  setHops(c);
                }}
              />
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
            </div>
          ))
        )}
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
