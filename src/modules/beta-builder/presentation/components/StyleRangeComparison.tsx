/**
 * Style Range Comparison Component
 *
 * Displays BJCP style ranges as semi-circular arc gauges showing where the
 * current recipe falls within the style specifications. Shows:
 * - ABV, OG, FG, SRM, IBU, BU/GU ratio
 * - Green arc zone for valid range, red for out-of-range
 * - Needle marker for current recipe value
 * - SRM gauge uses actual beer color gradient
 */

import { getBjcpStyleSpec } from "../../../../utils/bjcpSpecs";
import ArcGauge from "./ArcGauge";

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
  const code = styleCode?.split('.')[0]?.trim();
  const spec = getBjcpStyleSpec(code);

  if (!spec) {
    return null;
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
    <div className="bg-[rgb(var(--brew-card-inset))] border border-[rgb(var(--brew-border-subtle))] rounded-xl p-6">
      <h2 className="brew-section-title text-lg mb-4">BJCP Style Ranges</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
        <ArcGauge
          label="ABV"
          range={spec.abv}
          value={abv}
          format={(n) => `${n.toFixed(1)}%`}
        />
        <ArcGauge
          label="OG"
          range={spec.og}
          value={og}
          format={(n) => n.toFixed(3)}
        />
        <ArcGauge
          label="FG"
          range={spec.fg}
          value={fg}
          format={(n) => n.toFixed(3)}
        />
        <ArcGauge
          label="IBU"
          range={spec.ibu}
          value={ibu}
          format={(n) => n.toFixed(0)}
          maxFallback={100}
        />
        <ArcGauge
          label="BU/GU"
          range={buGuRange}
          value={buGu}
          format={(n) => n.toFixed(2)}
          maxFallback={1.2}
        />
        <ArcGauge
          label="SRM"
          range={
            spec.srm ??
            (spec.ebc ? [spec.ebc[0] / 1.97, spec.ebc[1] / 1.97] : undefined)
          }
          value={srm}
          format={(n) => n.toFixed(1)}
          isSrm={true}
        />
      </div>
    </div>
  );
}
