import { useMemo, useState } from "react";
import InputWithSuffix from "./InputWithSuffix";
import { getBjcpStyleSpec } from "../utils/bjcpSpecs";

type UnitSystem = "metric" | "us";
type Props = {
  styleName?: string;
  styleCode?: string;
  onClickStyleLink?: () => void;
  // Controlled optional props; if provided, component mirrors and calls onChange
  unit?: UnitSystem;
  volumes?: number;
  tempMetricC?: number;
  tempUsF?: number;
  onChange?: (state: {
    unit: UnitSystem;
    volumes: number;
    tempMetricC: number;
    tempUsF: number;
  }) => void;
};

// Uses the commonly referenced empirical fit for CO2 volumes vs temperature and pressure
// P(psi) = -16.6999 - 0.0101059*T + 0.00116512*T^2 + 0.173354*T*V + 4.24267*V - 0.0684226*V^2
// where T is temperature in °F, V is target volumes of CO2
// Source references used widely by homebrewing calculators (e.g., Brewer's Friend)
function calculatePsiFromTempFAndVolumes(
  tempF: number,
  volumes: number
): number {
  const t = tempF;
  const v = volumes;
  const psi =
    -16.6999 -
    0.0101059 * t +
    0.00116512 * t * t +
    0.173354 * t * v +
    4.24267 * v -
    0.0684226 * v * v;
  return Math.max(0, psi);
}

function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

function fToC(f: number): number {
  return ((f - 32) * 5) / 9;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function CarbonationCalculator({
  styleName,
  styleCode,
  onClickStyleLink,
  unit: unitProp,
  volumes: volumesProp,
  tempMetricC: tempMetricCProp,
  tempUsF: tempUsFProp,
  onChange,
}: Props) {
  // Internal state with controlled-prop fallbacks
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [volumes, setVolumes] = useState<number>(2.2);
  const [tempMetricC, setTempMetricC] = useState<number>(4); // default 4°C ≈ 39.2°F
  const [tempUsF, setTempUsF] = useState<number>(38);

  const unitValue = unitProp ?? unit;
  const volumesValue = volumesProp ?? volumes;
  const tempMetricCValue = tempMetricCProp ?? tempMetricC;
  const tempUsFValue = tempUsFProp ?? tempUsF;

  const update = (
    patch: Partial<{
      unit: UnitSystem;
      volumes: number;
      tempMetricC: number;
      tempUsF: number;
    }>
  ) => {
    // Establish next values based on current + patch
    const nextUnit = patch.unit ?? unitValue;
    let nextVolumes = patch.volumes ?? volumesValue;
    let nextTempC = patch.tempMetricC ?? tempMetricCValue;
    let nextTempF = patch.tempUsF ?? tempUsFValue;

    // If a temperature is explicitly updated, keep the other in sync
    if (patch.tempMetricC !== undefined && patch.tempUsF === undefined) {
      nextTempF = cToF(patch.tempMetricC);
    }
    if (patch.tempUsF !== undefined && patch.tempMetricC === undefined) {
      nextTempC = fToC(patch.tempUsF);
    }

    // If unit toggled, convert temperature so displayed number represents same physical temp
    if (patch.unit !== undefined && patch.unit !== unitValue) {
      if (patch.unit === "us") {
        // switching to US: derive F from current C
        nextTempF = cToF(nextTempC);
      } else {
        // switching to Metric: derive C from current F
        nextTempC = fToC(nextTempF);
      }
    }

    // Final rounding to one decimal place to avoid FP artifacts like 2.000000000000001
    nextVolumes = round1(nextVolumes);
    nextTempC = round1(nextTempC);
    nextTempF = round1(nextTempF);

    if (onChange) {
      onChange({
        unit: nextUnit,
        volumes: nextVolumes,
        tempMetricC: nextTempC,
        tempUsF: nextTempF,
      });
    } else {
      setUnit(nextUnit);
      setVolumes(nextVolumes);
      setTempMetricC(nextTempC);
      setTempUsF(nextTempF);
    }
  };

  const tempF = useMemo(
    () => (unitValue === "metric" ? cToF(tempMetricCValue) : tempUsFValue),
    [unitValue, tempMetricCValue, tempUsFValue]
  );
  const psi = useMemo(
    () => calculatePsiFromTempFAndVolumes(tempF, volumesValue),
    [tempF, volumesValue]
  );
  const bar = useMemo(() => psi * 0.0689475729, [psi]);
  const suggestion = useMemo(() => {
    if (styleCode) {
      const spec = getBjcpStyleSpec(styleCode);
      if (spec?.co2 && spec.co2.length === 2) {
        return { label: "BJCP", min: spec.co2[0], max: spec.co2[1] } as const;
      }
    }
    return suggestVolumesForStyle(styleName);
  }, [styleCode, styleName]);

  return (
    <section className="section-soft space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Carbonation</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Units</span>
          <select
            className="rounded-md border px-2 py-1 bg-black/20"
            value={unitValue}
            onChange={(e) =>
              update({ unit: e.currentTarget.value as UnitSystem })
            }
          >
            <option value="metric">Metric (°C, bar)</option>
            <option value="us">US (°F, psi)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <label className="block sm:col-span-1">
          <div className="text-sm text-white/50 mb-1">Target CO₂ Volumes</div>
          <InputWithSuffix
            value={volumesValue}
            onChange={(n) => update({ volumes: n })}
            suffix=" vols"
            suffixClassName="right-3 text-xs"
            step={0.1}
            min={0.5}
            max={5}
            placeholder="2.2"
          />
        </label>

        {unitValue === "metric" ? (
          <label className="block sm:col-span-1">
            <div className="text-sm text-white/50 mb-1">Beer Temp</div>
            <InputWithSuffix
              value={tempMetricCValue}
              onChange={(n) => update({ tempMetricC: n })}
              suffix=" °C"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              min={-1}
              max={30}
              placeholder="4.0"
            />
          </label>
        ) : (
          <label className="block sm:col-span-1">
            <div className="text-sm text-white/50 mb-1">Beer Temp</div>
            <InputWithSuffix
              value={tempUsFValue}
              onChange={(n) => update({ tempUsF: n })}
              suffix=" °F"
              suffixClassName="right-3 text-[10px]"
              step={1}
              min={28}
              max={90}
              placeholder="38"
            />
          </label>
        )}

        <div className="sm:col-span-2">
          <div className="rounded-md border border-white/10 bg-black/30 p-3">
            <div className="text-sm text-white/60">Regulator Setting</div>
            <div className="text-xl font-semibold">
              {unitValue === "us" ? (
                <>
                  {psi.toFixed(1)}{" "}
                  <span className="text-sm font-normal">psi</span>
                </>
              ) : (
                <>
                  {bar.toFixed(2)}{" "}
                  <span className="text-sm font-normal">bar</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {suggestion && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-white/60">
            Suggested for{" "}
            {styleCode ? (
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={onClickStyleLink}
              >
                {styleCode}
              </button>
            ) : null}
            {styleCode ? ". " : ""}
            {styleName}: {suggestion.min.toFixed(1)}–{suggestion.max.toFixed(1)}{" "}
            vols
          </div>
        </div>
      )}
    </section>
  );
}

function suggestVolumesForStyle(
  styleName?: string
): { label: string; min: number; max: number } | null {
  if (!styleName) return null;
  const s = styleName.toLowerCase();
  if (/(fruit).*lambic/.test(s))
    return { label: "Fruit Lambic", min: 3.0, max: 4.5 };
  if (/lambic|gueuze/.test(s)) return { label: "Lambic", min: 2.4, max: 2.8 };
  if (/wheat|weiss|weizen|wit|hefe|berliner/.test(s))
    return { label: "German/Belgian Wheat", min: 3.3, max: 4.5 };
  if (/stout|porter/.test(s))
    return { label: "Porter/Stout", min: 1.7, max: 2.3 };
  if (/belgian|tripel|dubbel|quad|trappist|saison/.test(s))
    return { label: "Belgian Ale", min: 1.9, max: 2.6 };
  if (/english|british|scottish|irish|bitter|mild|brown/.test(s))
    return { label: "British Isles Ale", min: 1.5, max: 2.0 };
  if (/lager|pils|helles|vienna|marzen|bock|dortmunder/.test(s))
    return { label: "Lager", min: 2.2, max: 2.7 };
  if (/american/.test(s))
    return { label: "American Ale/Lager", min: 2.2, max: 2.7 };
  return { label: "Typical", min: 2.2, max: 2.7 };
}
