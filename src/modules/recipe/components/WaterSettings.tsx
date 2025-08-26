import InlineEditableNumber from "../../../components/InlineEditableNumber";
import InputWithSuffix from "../../../components/InputWithSuffix";

export default function WaterSettings({
  show,
  onToggle,
  state,
  onChange,
}: {
  show: boolean;
  onToggle: () => void;
  state: {
    mashThicknessLPerKg: number;
    grainAbsorptionLPerKg: number;
    mashTunDeadspaceL: number;
    mashTunCapacityL?: number;
    boilTimeMin: number;
    boilOffRateLPerHour: number;
    coolingShrinkagePercent: number;
    kettleLossL: number;
    chillerLossL: number;
    brewMethod: "three-vessel" | "biab-full" | "biab-sparge";
  };
  onChange: (patch: Partial<WaterSettingsProps["state"]>) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          Water is automatic from grains + target volume.
        </div>
        <button
          className="text-sm underline underline-offset-4 hover:text-white/90"
          onClick={onToggle}
        >
          {show ? "Hide water settings" : "Show water settings"}
        </button>
      </div>
      {show && (
        <section className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Mash Thickness</div>
            <InputWithSuffix
              value={state.mashThicknessLPerKg}
              onChange={(n) => onChange({ mashThicknessLPerKg: n })}
              suffix=" L/kg"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="3.0"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Brew Method</div>
            <select
              className="w-full rounded-md border px-2 py-2.5"
              value={state.brewMethod}
              onChange={(e) =>
                onChange({
                  brewMethod: e.target
                    .value as WaterSettingsProps["state"]["brewMethod"],
                })
              }
            >
              <option value="three-vessel">3-vessel</option>
              <option value="biab-full">BIAB (full-volume)</option>
              <option value="biab-sparge">BIAB (with sparge)</option>
            </select>
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">
              Grain Absorption
            </div>
            <InputWithSuffix
              value={state.grainAbsorptionLPerKg}
              onChange={(n) => onChange({ grainAbsorptionLPerKg: n })}
              suffix=" L/kg"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="0.8"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">
              Mash Tun Deadspace
            </div>
            <InputWithSuffix
              value={state.mashTunDeadspaceL}
              onChange={(n) => onChange({ mashTunDeadspaceL: n })}
              suffix=" L"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="0.5"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">
              Mash Tun Capacity
            </div>
            <InputWithSuffix
              value={state.mashTunCapacityL ?? 0}
              onChange={(n) =>
                onChange({
                  mashTunCapacityL: Number.isFinite(n) && n > 0 ? n : undefined,
                })
              }
              suffix=" L"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="optional"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Boil Time</div>
            <InputWithSuffix
              value={state.boilTimeMin}
              onChange={(n) => onChange({ boilTimeMin: n })}
              suffix=" min"
              suffixClassName="right-3 text-[10px]"
              step={5}
              placeholder="60"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Boil-off Rate</div>
            <InputWithSuffix
              value={state.boilOffRateLPerHour}
              onChange={(n) => onChange({ boilOffRateLPerHour: n })}
              suffix=" L/hr"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="3.0"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">
              Cooling Shrinkage (%)
            </div>
            <InlineEditableNumber
              value={state.coolingShrinkagePercent}
              onChange={(n) => onChange({ coolingShrinkagePercent: n })}
              suffix="%"
              suffixClassName="left-9 right-0.5 text-[10px]"
              step={0.1}
              placeholder="4"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Kettle Loss</div>
            <InputWithSuffix
              value={state.kettleLossL}
              onChange={(n) => onChange({ kettleLossL: n })}
              suffix=" L"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="0.5"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Chiller Loss</div>
            <InputWithSuffix
              value={state.chillerLossL}
              onChange={(n) => onChange({ chillerLossL: n })}
              suffix=" L"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="0"
            />
          </label>
        </section>
      )}
    </>
  );
}

type WaterSettingsProps = Parameters<typeof WaterSettings>[0];
