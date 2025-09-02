import { useState } from "react";
import WaterSaltsCalc from "./WaterSaltsCalc";

export default function WaterSaltsSection({
  mashWaterL,
  spargeWaterL,
  onChange,
  initialTotalSalts,
  initialSourceProfileName,
  initialTargetProfileName,
  initialSourceProfile,
  initialTargetProfile,
}: {
  mashWaterL: number;
  spargeWaterL: number;
  onChange?: (data: {
    mashSalts: import("../utils/water").SaltAdditions;
    spargeSalts: import("../utils/water").SaltAdditions;
    totalSalts: import("../utils/water").SaltAdditions;
    totalProfile: import("../utils/water").WaterProfile;
    sourceProfileName: string;
    targetProfileName: string;
    sourceProfile: import("../utils/water").WaterProfile;
    targetProfile: import("../utils/water").WaterProfile;
  }) => void;
  initialTotalSalts?: import("../utils/water").SaltAdditions;
  initialSourceProfileName?: string;
  initialTargetProfileName?: string;
  initialSourceProfile?: import("../utils/water").WaterProfile;
  initialTargetProfile?: import("../utils/water").WaterProfile;
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
        onChange={onChange}
        initialTotalSalts={initialTotalSalts}
        initialSourceProfileName={initialSourceProfileName}
        initialTargetProfileName={initialTargetProfileName}
        initialSourceProfile={initialSourceProfile}
        initialTargetProfile={initialTargetProfile}
      />
    </>
  );
}
