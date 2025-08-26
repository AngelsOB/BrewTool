import FitToWidth from "../../../components/FitToWidth";

export default function BatchSummary({
  name,
  ogUsed,
  abv,
  srm,
  color,
  ibu,
  preBoilVolumeL,
  finalMashL,
  finalSpargeL,
  batchVolumeL,
}: {
  name: string;
  ogUsed: number;
  abv: number;
  srm: number;
  color: string;
  ibu: number;
  preBoilVolumeL: number;
  finalMashL: number;
  finalSpargeL: number;
  batchVolumeL: number;
}) {
  return (
    <div className="sticky top-14 z-10 mx-auto max-w-6xl py-2 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify_between gap-3 rounded-xl border border-white/10 bg-white/40 px-3 py-2 shadow-soft ring-1 ring-neutral-900/5 supports-[backdrop-filter]:bg-white/25">
        <div className="flex items-center gap-2 text-sm font-medium tracking-tight text-white/50 shrink-0">
          <span>{name}</span>
        </div>
        <FitToWidth className="min-w-0 flex-1" align="right" minScale={0.75}>
          <div className="inline-flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft shadow-lg shadow-black/30 hover:shadow-sm">
              <span className="text-neutral-600">OG</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {ogUsed.toFixed(3)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft shadow-lg shadow-black/30 hover:shadow-sm">
              <span className="text-neutral-600">ABV</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {abv.toFixed(2)}%
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft shadow-lg shadow-black/30 hover:shadow-sm">
              <span className="text-neutral-600">SRM</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {srm.toFixed(1)}
              </span>
              <span
                className="h-4 w-8 shrink-0 rounded-md border border-white/20"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft shadow-lg shadow-black/30 hover:shadow-sm">
              <span className="text-neutral-600">IBU</span>
              <span className="font-semibold tracking-tight text-neutral-900">
                {ibu.toFixed(0)}
              </span>
            </div>
            <div className="relative group inline-flex">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft shadow-lg shadow-black/30 hover:shadow-sm">
                <span className="text-neutral-600">Batch</span>
                <span className="font-semibold tracking-tight text-neutral-900">
                  {batchVolumeL.toFixed(1)} L
                </span>
              </div>
              <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-max flex-col gap-2 rounded-lg border border-white/20 bg-white/90 px-3 py-2 text-xs shadow-2xl shadow-black/30 backdrop-blur-2xl ring-1 ring-white/50 supports-[backdrop-filter]:bg-white/70 group-hover:flex">
                <div className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="text-neutral-600">Pre-boil</span>
                  <span className="font-semibold tracking-tight text-neutral-900">
                    {preBoilVolumeL.toFixed(1)} L
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="text-neutral-600">Mash / Sparge</span>
                  <span className="font-semibold tracking-tight text-neutral-900">
                    {finalMashL.toFixed(1)} / {finalSpargeL.toFixed(1)} L
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FitToWidth>
      </div>
    </div>
  );
}
