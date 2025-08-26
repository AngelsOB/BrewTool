import { useState } from "react";
import WaterSaltsCalc from "./WaterSaltsCalc";

export default function WaterSaltsSection({
  mashWaterL,
  spargeWaterL,
}: {
  mashWaterL: number;
  spargeWaterL: number;
}) {
  const [compact, setCompact] = useState<boolean>(true);
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="font-semibold text-primary-strong">Water Chemistry</div>
        <button
          type="button"
          className="text-xs rounded-md border px-2 py-1 text-white/40 shadow-lg shadow-black/30 hover:shadow-sm hover:bg-white/10"
          onClick={() => setCompact((c) => !c)}
        >
          {compact ? "Show Calculator" : "Collapse Calculator"}
        </button>
      </div>
      <WaterSaltsCalc
        mashWaterL={mashWaterL}
        spargeWaterL={spargeWaterL}
        variant="embedded"
        compact={compact}
        onCompactChange={setCompact}
      />
    </>
  );
}
