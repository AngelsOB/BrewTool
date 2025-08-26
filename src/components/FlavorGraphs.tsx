import { useState } from "react";
import HopFlavorRadar from "./HopFlavorRadar";
import type { HopItem } from "../hooks/useRecipeStore";

export default function FlavorGraphs({
  baseSeries,
  estFlavor,
}: {
  baseSeries: { name: string; flavor: NonNullable<HopItem["flavor"]> }[];
  estFlavor: NonNullable<HopItem["flavor"]>;
}) {
  const [mode, setMode] = useState<"base" | "estimated">("base");
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">Hop Flavor Profile</div>
        <div className="flex items-center gap-2 text-sm">
          <button
            className={`rounded-md px-2 py-1 border ${
              mode === "base" ? "bg-white/80" : "bg-white/30"
            }`}
            onClick={() => setMode("base")}
          >
            Preset
          </button>
          <button
            className={`rounded-md px-2 py-1 border ${
              mode === "estimated" ? "bg-white/80" : "bg-white/30"
            }`}
            onClick={() => setMode("estimated")}
          >
            Estimated
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 p-3 shadow-soft bg-white/3">
        {mode === "base" ? (
          <HopFlavorRadar
            title="Base hop profiles"
            emptyHint="Pick hops with flavor data"
            series={baseSeries}
            colorStrategy="index"
            labelColorize={true}
            outerPadding={72}
            ringRadius={140}
          />
        ) : (
          <HopFlavorRadar
            title="Estimated final aroma emphasis"
            emptyHint="Increase dose or add late/dry hops"
            series={[{ name: "Total (est.)", flavor: estFlavor }]}
            colorStrategy="dominant"
            labelColorize={true}
            showLegend={false}
            outerPadding={72}
            ringRadius={140}
          />
        )}
      </div>
    </section>
  );
}
