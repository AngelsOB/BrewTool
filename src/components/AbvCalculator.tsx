import { useMemo, useState } from "react";
import CalculatorCard from "./CalculatorCard";
import { abvFromOGFG } from "../calculators/abv";

function parseGravity(input: string): number | null {
  const value = input.trim();
  if (value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function AbvCalculator() {
  const [ogInput, setOgInput] = useState<string>("1.050");
  const [fgInput, setFgInput] = useState<string>("1.010");

  const { abv, error } = useMemo(() => {
    const ogVal = parseGravity(ogInput);
    const fgVal = parseGravity(fgInput);
    if (ogVal == null || fgVal == null) {
      return { abv: null as number | null, error: "Enter OG and FG" };
    }
    if (ogVal < 0.99 || ogVal > 1.2)
      return { abv: null, error: "OG out of range" };
    if (fgVal < 0.99 || fgVal > 1.2)
      return { abv: null, error: "FG out of range" };
    if (fgVal > ogVal) return { abv: null, error: "FG must be <= OG" };
    const abv = abvFromOGFG(ogVal, fgVal);
    return { abv, error: null as string | null };
  }, [ogInput, fgInput]);

  return (
    <CalculatorCard title="ABV (OG/FG)">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">
            Original Gravity (OG)
          </div>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0.99"
            max="1.2"
            className="w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            value={ogInput}
            onChange={(e) => setOgInput(e.target.value)}
            placeholder="1.050"
          />
        </label>
        <label className="block">
          <div className="text-sm text-neutral-700 mb-1">
            Final Gravity (FG)
          </div>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0.99"
            max="1.2"
            className="w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            value={fgInput}
            onChange={(e) => setFgInput(e.target.value)}
            placeholder="1.010"
          />
        </label>
      </div>

      <div className="mt-3">
        {error ? (
          <div className="text-sm text-neutral-600">{error}</div>
        ) : (
          <div className="rounded-lg border bg-emerald-500/10 px-4 py-3">
            <div className="text-sm text-neutral-700">Estimated ABV</div>
            <div className="text-3xl font-semibold tracking-tight">
              {abv != null ? `${abv.toFixed(2)}%` : "—"}
            </div>
          </div>
        )}
      </div>
    </CalculatorCard>
  );
}
