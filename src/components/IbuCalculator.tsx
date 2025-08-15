import { useMemo, useState } from "react";
import CalculatorCard from "./CalculatorCard";
import {
  ibuTotal,
  type HopAddition,
  type HopTimingType,
} from "../calculators/ibu";

type VolumeUnit = "L" | "gal";

export default function IbuCalculator() {
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>("L");
  const [postBoilVolume, setPostBoilVolume] = useState<string>("20"); // L by default
  const [og, setOg] = useState<string>("1.050");
  const [hops, setHops] = useState<
    Array<{ grams: string; aa: string; time: string }>
  >([{ grams: "20", aa: "10", time: "60" }]);

  const liters = useMemo(() => {
    const v = Number(postBoilVolume);
    if (!Number.isFinite(v) || v <= 0) return null;
    return volumeUnit === "L" ? v : v / 0.264172;
  }, [postBoilVolume, volumeUnit]);

  const ibu = useMemo(() => {
    const gravity = Number(og);
    if (!Number.isFinite(gravity) || gravity < 1 || gravity > 1.2) return null;
    if (liters == null) return null;
    const additions: HopAddition[] = hops
      .map((h) => ({
        weightGrams: Number(h.grams),
        alphaAcidPercent: Number(h.aa),
        boilTimeMinutes: Number(h.time),
        type: "boil" as HopTimingType, // Default to 'boil' for this calculator
      }))
      .filter(
        (h) =>
          Number.isFinite(h.weightGrams) &&
          Number.isFinite(h.alphaAcidPercent) &&
          Number.isFinite(h.boilTimeMinutes) &&
          h.weightGrams > 0 &&
          h.alphaAcidPercent > 0 &&
          h.boilTimeMinutes >= 0
      );
    if (additions.length === 0) return null;
    return ibuTotal(additions, liters, gravity);
  }, [hops, liters, og]);

  return (
    <CalculatorCard title="IBU (Tinseth)">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">Post-boil Volume</div>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              className="w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              value={postBoilVolume}
              onChange={(e) => setPostBoilVolume(e.target.value)}
              placeholder={volumeUnit === "L" ? "20" : "5"}
            />
            <select
              className="rounded-md border px-2 py-2"
              value={volumeUnit}
              onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
            >
              <option value="L">L</option>
              <option value="gal">gal</option>
            </select>
          </div>
        </label>

        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">Original Gravity</div>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            min="1.000"
            max="1.2"
            className="w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            value={og}
            onChange={(e) => setOg(e.target.value)}
            placeholder="1.050"
          />
        </label>
      </div>

      <div className="mt-3 space-y-3">
        {hops.map((h, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              aria-label="Grams"
              type="number"
              min="0"
              step="0.1"
              className="rounded-md border px-3 py-2"
              value={h.grams}
              onChange={(e) => {
                const c = [...hops];
                c[i] = { ...c[i], grams: e.target.value };
                setHops(c);
              }}
              placeholder="20"
            />
            <input
              aria-label="Alpha %"
              type="number"
              min="0"
              step="0.1"
              className="rounded-md border px-3 py-2"
              value={h.aa}
              onChange={(e) => {
                const c = [...hops];
                c[i] = { ...c[i], aa: e.target.value };
                setHops(c);
              }}
              placeholder="10"
            />
            <input
              aria-label="Minutes"
              type="number"
              min="0"
              step="1"
              className="rounded-md border px-3 py-2"
              value={h.time}
              onChange={(e) => {
                const c = [...hops];
                c[i] = { ...c[i], time: e.target.value };
                setHops(c);
              }}
              placeholder="60"
            />
          </div>
        ))}
        <div>
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
            onClick={() =>
              setHops((h) => [...h, { grams: "", aa: "", time: "" }])
            }
          >
            + Hop Addition
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="rounded-lg border bg-emerald-500/10 px-4 py-3">
          <div className="text-sm text-neutral-700">Estimated IBU</div>
          <div className="text-3xl font-semibold tracking-tight">
            {ibu != null ? ibu.toFixed(1) : "—"}
          </div>
        </div>
      </div>
    </CalculatorCard>
  );
}
