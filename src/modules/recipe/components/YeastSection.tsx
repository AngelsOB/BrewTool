import { getYeastPresets } from "../../../utils/presets";
import type { YeastItem } from "../../../hooks/useRecipeStore";
import YeastPitchCalc from "../../../components/YeastPitchCalc";

export default function YeastSection({
  yeast,
  onChangeYeast,
  ogUsed,
  batchVolumeL,
  onStarterChange,
}: {
  yeast: YeastItem;
  onChangeYeast: (next: YeastItem) => void;
  ogUsed: number;
  batchVolumeL: number;
  onStarterChange?: (state: {
    yeastType: "liquid-100" | "liquid-200" | "dry" | "slurry";
    packs: number;
    mfgDate: string;
    slurryLiters: number;
    slurryBillionPerMl: number;
    steps: Array<{
      id: string;
      liters: number;
      gravity: number;
      model:
        | { kind: "white"; aeration: "none" | "shaking" }
        | { kind: "braukaiser" };
      dmeGrams: number;
      endBillion: number;
    }>;
    requiredCellsB: number;
    cellsAvailableB: number;
    finalEndB: number;
    totalStarterL: number;
    totalDmeG: number;
  }) => void;
}) {
  return (
    <section className="section-soft space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text_PRIMARY-strong">Yeast</div>
      </div>
      <label className="flex flex-col">
        <select
          className="w-full rounded-md border px-2 py-2.5"
          value={yeast.name}
          onChange={(e) => {
            const preset = getYeastPresets().find(
              (p) => p.name === e.target.value
            );
            if (!preset) return;
            onChangeYeast(preset);
          }}
        >
          <option value="" disabled>
            Select Yeast...
          </option>
          {getYeastPresets()
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
        </select>
      </label>
      {yeast.attenuationPercent && (
        <div className="text-sm text-neutral-600">
          Est. Attenuation: {(yeast.attenuationPercent * 100).toFixed(0)}%
        </div>
      )}
      <div className="pt-1">
        <YeastPitchCalc
          og={ogUsed}
          volumeL={batchVolumeL}
          onChange={onStarterChange}
        />
      </div>
    </section>
  );
}
