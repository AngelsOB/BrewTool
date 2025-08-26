import InputWithSuffix from "../../../components/InputWithSuffix";

type MashStep = {
  id: string;
  type: "infusion" | "decoction" | "ramp";
  tempC: number;
  timeMin: number;
  decoctionPercent?: number;
};

export default function MashSchedule({
  steps,
  onAdd,
  onUpdate,
  onRemove,
}: {
  steps: MashStep[];
  onAdd: () => void;
  onUpdate: (index: number, next: MashStep) => void;
  onRemove: (id: string) => void;
}) {
  const hasDecoctionStep = steps.some((s) => s.type === "decoction");
  return (
    <section className="section-soft space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text-primary-strong">Mash Schedule</div>
        <button className="hidden sm:block btn-neon" onClick={onAdd}>
          + Add Step
        </button>
      </div>
      <div className="space-y-2">
        <div
          className={
            "hidden sm:grid gap-2 text-xs text-muted " +
            (hasDecoctionStep
              ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(8rem,0.6fr)_min-content]"
              : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]")
          }
        >
          <div>Type</div>
          <div>Temp</div>
          <div>Time</div>
          {hasDecoctionStep && <div>Boil %</div>}
          <div></div>
        </div>
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={
              "grid grid-cols-1 gap-2 items-end " +
              (hasDecoctionStep
                ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(8rem,0.6fr)_min-content]"
                : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]")
            }
          >
            <label className="block">
              <div className="text-xs text-muted mb-1 sm:hidden">Type</div>
              <select
                className="w-full rounded-md border px-2 py-2.5"
                value={s.type}
                onChange={(e) =>
                  onUpdate(i, {
                    ...s,
                    type: e.target.value as MashStep["type"],
                  })
                }
              >
                <option value="infusion">Infusion</option>
                <option value="ramp">Ramp</option>
                <option value="decoction">Decoction</option>
              </select>
            </label>
            <label className="block">
              <div className="text-xs text-muted mb-1 sm:hidden">Temp</div>
              <InputWithSuffix
                value={s.tempC}
                onChange={(n) => onUpdate(i, { ...s, tempC: n })}
                step={0.5}
                suffix="°C"
                suffixClassName="right-3 text-[10px]"
              />
            </label>
            <label className="block">
              <div className="text-xs text-muted mb-1 sm:hidden">Time</div>
              <InputWithSuffix
                value={s.timeMin}
                onChange={(n) => onUpdate(i, { ...s, timeMin: n })}
                step={1}
                suffix=" min"
                suffixClassName="right-3 text-[10px]"
              />
            </label>
            {hasDecoctionStep &&
              (s.type === "decoction" ? (
                <label className="block sm:col-span-1">
                  <div className="text-xs text-muted mb-1 sm:hidden">
                    Boil %
                  </div>
                  <InputWithSuffix
                    value={s.decoctionPercent ?? 20}
                    onChange={(n) => onUpdate(i, { ...s, decoctionPercent: n })}
                    step={1}
                    suffix="%"
                    suffixClassName="right-3 text-[10px]"
                  />
                </label>
              ) : (
                <div className="hidden sm:block" />
              ))}
            <div className="flex justify-end">
              <button
                className="p-2 text-neutral-400 hover:text-red-500"
                onClick={() => onRemove(s.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button className="block sm:hidden w-full btn-neon" onClick={onAdd}>
          + Add Step
        </button>
      </div>
    </section>
  );
}
