import { useMemo, useState } from "react";
import HopFlavorRadar from "./HopFlavorRadar";
import type { HopItem } from "../modules/recipe/types";
import type { HopFlavorProfile } from "../utils/presets";
import { EMPTY_HOP_FLAVOR } from "../utils/presets";

export default function FlavorGraphs({
  baseSeries,
  estFlavor,
}: {
  baseSeries: { name: string; flavor: NonNullable<HopItem["flavor"]> }[];
  estFlavor: NonNullable<HopItem["flavor"]>;
}) {
  const [mode, setMode] = useState<"base" | "estimated">("base");
  const toProfile = (f: NonNullable<HopItem["flavor"]>): HopFlavorProfile => {
    const anyf: any = f as any;
    return {
      ...EMPTY_HOP_FLAVOR,
      // Support both legacy UI shape and canonical HopFlavorProfile
      citrus: anyf.citrus ?? 0,
      floral: anyf.floral ?? 0,
      tropicalFruit: anyf.tropicalFruit ?? anyf.fruity ?? 0,
      stoneFruit: anyf.stoneFruit ?? 0,
      berry: anyf.berry ?? 0,
      herbal: anyf.herbal ?? 0,
      spice: anyf.spice ?? anyf.spicy ?? 0,
      resinPine: anyf.resinPine ?? anyf.piney ?? 0,
      grassy: anyf.grassy ?? anyf.earthy ?? 0,
    };
  };
  const baseSeriesMapped = useMemo(
    () =>
      baseSeries.map((s) => ({ name: s.name, flavor: toProfile(s.flavor) })),
    [baseSeries]
  );
  const estFlavorMapped = useMemo(() => toProfile(estFlavor), [estFlavor]);
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
            series={baseSeriesMapped}
            colorStrategy="index"
            labelColorize={true}
            outerPadding={72}
            ringRadius={140}
          />
        ) : (
          <HopFlavorRadar
            title="Estimated final aroma emphasis"
            emptyHint="Increase dose or add late/dry hops"
            series={[{ name: "Total (est.)", flavor: estFlavorMapped }]}
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
