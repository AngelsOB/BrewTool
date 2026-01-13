/**
 * Style Range Comparison Component
 *
 * Displays BJCP style ranges with bar graphs showing where the current recipe
 * falls within the style specifications. Shows:
 * - ABV, OG, FG, SRM, IBU, BU/GU ratio
 * - Green bar for valid range
 * - Red bars for out-of-range areas
 * - Blue marker for current recipe value
 */

import { getBjcpStyleSpec } from "../../../../utils/bjcpSpecs";
import type { BjcpStyleSpec } from "../../../../utils/bjcpSpecs";

interface StyleRangeComparisonProps {
  styleCode?: string;
  abv: number;
  og: number;
  fg: number;
  ibu: number;
  srm: number;
}

export default function StyleRangeComparison({
  styleCode,
  abv,
  og,
  fg,
  ibu,
  srm,
}: StyleRangeComparisonProps) {
  const spec = getBjcpStyleSpec(styleCode);

  if (!spec) {
    return (
      <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 border border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold mb-4">BJCP Style Ranges</h2>
        <p className="text-gray-500 dark:text-gray-400 italic text-sm">
          Select a beer style to see BJCP range comparison
        </p>
      </div>
    );
  }

  function RangeBar({
    label,
    range,
    value,
    format = (n: number) => n.toString(),
    maxFallback,
  }: {
    label: string;
    range?: [number, number];
    value: number;
    format?: (n: number) => string;
    maxFallback?: number;
  }) {
    const min = range?.[0] ?? 0;
    const max = range?.[1] ?? maxFallback ?? Math.max(min + 1, value * 1.5);
    const span = Math.max(0.0001, range ? max - min : Math.abs(value - min) || 0.0001);
    const pad = span * 0.15;
    const domMin = range ? Math.min(min, value) - pad : value - pad;
    const domMax = range ? Math.max(max, value) + pad : value + pad;

    const clampPct = (n: number) => Math.max(0, Math.min(100, n));
    const toPct = (n: number) =>
      ((n - domMin) / Math.max(0.00001, domMax - domMin)) * 100;

    const minPct = range ? clampPct(toPct(min)) : 0;
    const maxPct = range ? clampPct(toPct(max)) : 100;
    const valPct = clampPct(toPct(value));

    // Determine if value is in range
    const inRange = range ? value >= min && value <= max : true;

    return (
      <div className="grid grid-cols-[5rem_1fr] items-center gap-3 py-2">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </div>
        <div className="relative h-8 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden border border-[rgb(var(--border))]">
          {/* Out of range - below min */}
          {range && minPct > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-red-100 dark:bg-red-900/30"
              style={{ width: `${minPct}%` }}
            />
          )}

          {/* Valid range */}
          {range && (
            <div
              className="absolute inset-y-0 bg-green-100 dark:bg-green-900/30 border-x border-green-400 dark:border-green-600"
              style={{
                left: `${minPct}%`,
                width: `${Math.max(0, maxPct - minPct)}%`,
              }}
            />
          )}

          {/* Out of range - above max */}
          {range && maxPct < 100 && (
            <div
              className="absolute inset-y-0 right-0 bg-red-100 dark:bg-red-900/30"
              style={{ width: `${Math.max(0, 100 - maxPct)}%` }}
            />
          )}

          {/* Current value marker */}
          <div
            className={`absolute top-0 bottom-0 w-1 shadow-lg ${
              inRange
                ? "bg-blue-500 dark:bg-blue-400"
                : "bg-red-500 dark:bg-red-400"
            }`}
            style={{ left: `${valPct}%` }}
            title={format(value)}
          />

          {/* Range labels */}
          {range && (
            <>
              <div
                className="absolute -translate-x-1/2 top-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400"
                style={{ left: `${minPct}%` }}
              >
                {format(min)}
              </div>
              <div
                className="absolute -translate-x-1/2 top-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400"
                style={{ left: `${maxPct}%` }}
              >
                {format(max)}
              </div>
            </>
          )}

          {/* Current value label */}
          <div
            className={`absolute -translate-x-1/2 bottom-0.5 text-[10px] font-semibold px-1 py-0.5 rounded ${
              inRange
                ? "bg-blue-500 dark:bg-blue-600 text-white"
                : "bg-red-500 dark:bg-red-600 text-white"
            }`}
            style={{ left: `${valPct}%` }}
          >
            {format(value)}
          </div>
        </div>
      </div>
    );
  }

  // Calculate BU/GU ratio
  const ogPoints = Math.max(0, Math.round((og - 1) * 1000));
  const buGu = ogPoints > 0 ? ibu / ogPoints : 0;
  let buGuRange: [number, number] | undefined = undefined;

  if (spec?.ibu && spec?.og) {
    const ogMinPts = Math.max(1, Math.round((spec.og[0] - 1) * 1000));
    const ogMaxPts = Math.max(1, Math.round((spec.og[1] - 1) * 1000));
    const derivedMin = spec.ibu[0] / ogMaxPts;
    const derivedMax = spec.ibu[1] / ogMinPts;
    const lo = Math.min(derivedMin, derivedMax);
    const hi = Math.max(derivedMin, derivedMax);
    buGuRange = [Number(lo.toFixed(2)), Number(hi.toFixed(2))];
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 border-t-4 border-purple-500">
      <h2 className="text-xl font-semibold mb-4">BJCP Style Ranges</h2>
      <div className="space-y-1">
        <RangeBar
          label="ABV"
          range={spec.abv}
          value={abv}
          format={(n) => `${n.toFixed(1)}%`}
        />
        <RangeBar
          label="OG"
          range={spec.og}
          value={og}
          format={(n) => n.toFixed(3)}
        />
        <RangeBar
          label="FG"
          range={spec.fg}
          value={fg}
          format={(n) => n.toFixed(3)}
        />
        <RangeBar
          label="SRM"
          range={
            spec.srm ??
            (spec.ebc ? [spec.ebc[0] / 1.97, spec.ebc[1] / 1.97] : undefined)
          }
          value={srm}
          format={(n) => n.toFixed(1)}
        />
        <RangeBar
          label="IBU"
          range={spec.ibu}
          value={ibu}
          format={(n) => n.toFixed(0)}
          maxFallback={100}
        />
        <RangeBar
          label="BU/GU"
          range={buGuRange}
          value={buGu}
          format={(n) => n.toFixed(2)}
          maxFallback={1.2}
        />
      </div>
    </div>
  );
}
