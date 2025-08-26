import { getBjcpStyleSpec } from "../utils/bjcpSpecs";

export default function StyleRangeBars({
  styleCode,
  abv,
  og,
  fg,
  ibu,
  srm,
}: {
  styleCode?: string;
  abv: number;
  og: number;
  fg: number;
  ibu: number;
  srm: number;
}) {
  const spec = getBjcpStyleSpec(styleCode);
  if (!spec) {
    return (
      <div className="rounded-md border border-white/10 bg-white/10 p-3 text-sm text-white/70">
        No BJCP ranges available for the selected style.
      </div>
    );
  }

  function Row({
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
    const span = Math.max(
      0.0001,
      (range ? max - min : Math.abs(value - min)) || 0.0001
    );
    const pad = span * 0.15;
    const domMin = range ? Math.min(min, value) - pad : value - pad;
    const domMax = range ? Math.max(max, value) + pad : value + pad;
    const clampPct = (n: number) => Math.max(0, Math.min(100, n));
    const toPct = (n: number) =>
      ((n - domMin) / Math.max(0.00001, domMax - domMin)) * 100;

    const minPct = range ? clampPct(toPct(min)) : 0;
    const maxPct = range ? clampPct(toPct(max)) : 100;
    const valPct = clampPct(toPct(value));

    return (
      <div className="grid grid-cols-[5rem_1fr] items-center gap-2 py-1">
        <div className="text-xs font-semibold tracking-tight text-white/80">
          {label}
        </div>
        <div className="relative h-6 rounded-sm bg-neutral-800/90 ring-1 ring-black/50 overflow-hidden">
          {range && minPct > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-red-900/50"
              style={{ width: `${minPct}%` }}
            />
          )}
          {range && (
            <div
              className="absolute inset-y-0 bg-green-700/85"
              style={{
                left: `${minPct}%`,
                width: `${Math.max(0, maxPct - minPct)}%`,
              }}
            />
          )}
          {range && maxPct < 100 && (
            <div
              className="absolute inset-y-0 right-0 bg-red-900/50"
              style={{ width: `${Math.max(0, 100 - maxPct)}%` }}
            />
          )}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]"
            style={{ left: `${valPct}%` }}
            title={format(value)}
          />
          {range && (
            <>
              <div
                className="absolute -translate-x-1/2 top-0 text-[10px] text-white/80"
                style={{ left: `${minPct}%` }}
              >
                {format(min)}
              </div>
              <div
                className="absolute -translate-x-1/2 top-0 text-[10px] text-white/80"
                style={{ left: `${maxPct}%` }}
              >
                {format(max)}
              </div>
            </>
          )}
          <div
            className="absolute -translate-x-1/2 top-0 text-[10px] font-semibold text-white"
            style={{ left: `${valPct}%` }}
          >
            {format(value)}
          </div>
        </div>
      </div>
    );
  }

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
    <div className="rounded-md border border-white/10 bg-neutral-900/40 p-3">
      <div className="space-y-1">
        <Row
          label="ABV"
          range={spec.abv}
          value={abv}
          format={(n) => `${n.toFixed(1)}%`}
        />
        <Row
          label="OG"
          range={spec.og}
          value={og}
          format={(n) => n.toFixed(3)}
        />
        <Row
          label="FG"
          range={spec.fg}
          value={fg}
          format={(n) => n.toFixed(3)}
        />
        <Row
          label="SRM"
          range={
            spec.srm ??
            (spec.ebc ? [spec.ebc[0] / 1.97, spec.ebc[1] / 1.97] : undefined)
          }
          value={srm}
          format={(n) => n.toFixed(1)}
        />
        <Row
          label="IBU"
          range={spec.ibu}
          value={ibu}
          format={(n) => n.toFixed(0)}
          maxFallback={100}
        />
        <Row
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
