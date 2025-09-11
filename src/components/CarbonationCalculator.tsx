import { useMemo, useState } from "react";
import InputWithSuffix from "./InputWithSuffix";
import DualUnitInput from "./DualUnitInput";
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
  onChange,
}: Props) {
  // Internal state with controlled-prop fallbacks
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [volumes, setVolumes] = useState<number>(2.2);
  const [tempMetricC, setTempMetricC] = useState<number>(4); // default 4°C ≈ 39.2°F

  const unitValue = unitProp ?? unit;
  const volumesValue = volumesProp ?? volumes;
  const tempMetricCValue = tempMetricCProp ?? tempMetricC;

  const update = (
    patch: Partial<{
      unit: UnitSystem;
      volumes: number;
      tempMetricC: number;
    }>
  ) => {
    // Establish next values based on current + patch
    const nextUnit = patch.unit ?? unitValue;
    let nextVolumes = patch.volumes ?? volumesValue;
    let nextTempC = patch.tempMetricC ?? tempMetricCValue;

    // Final rounding to one decimal place to avoid FP artifacts like 2.000000000000001
    nextVolumes = round1(nextVolumes);
    nextTempC = round1(nextTempC);

    // Calculate Fahrenheit from Celsius for the onChange callback
    const nextTempF = round1(cToF(nextTempC));

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
    }
  };

  const tempF = useMemo(() => cToF(tempMetricCValue), [tempMetricCValue]);
  const psi = useMemo(
    () => calculatePsiFromTempFAndVolumes(tempF, volumesValue),
    [tempF, volumesValue]
  );
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block">
          <div className="text-sm text-white/50 mb-1">Target CO₂ Volumes</div>
          <InputWithSuffix
            value={volumesValue}
            onChange={(n: number) => update({ volumes: n })}
            suffix=" vols"
            suffixClassName="right-3 text-xs"
            step={0.1}
            min={0.5}
            max={5}
            placeholder="2.2"
          />
        </label>

        <label className="block">
          <div className="text-sm text-white/50 mb-1">Beer Temp</div>
          <DualUnitInput
            value={tempMetricCValue}
            onChange={(n) => update({ tempMetricC: n })}
            unitType="temperature"
            step={0.1}
            min={-1}
            max={30}
            placeholder="4.0"
          />
        </label>

        <label className="block">
          <div className="text-sm text-white/50 mb-1">Regulator Setting</div>
          <DualUnitInput
            value={psi}
            onChange={() => {}} // Read-only display
            unitType="pressure"
            readOnly={true}
            placeholder="12.5"
          />
        </label>
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
