import { useEffect, useMemo, useRef, useState } from "react";
import Collapsible from "../components/Collapsible";
import {
  useRecipeStore,
  type GrainItem,
  type HopItem,
  type HopTimingType,
  type YeastItem,
} from "../hooks/useRecipeStore";
import {
  abvSimple,
  mcuFromGrainBill,
  ogFromPoints,
  pointsFromGrainBill,
  srmMoreyFromMcu,
  srmToHex,
} from "../utils/calculations";
import {
  totalGrainWeightKg,
  computePreBoilVolumeL,
  computeMashWaterL,
  computeSpargeWaterL,
  computeSpargeFromMashUsedL,
  type WaterParams,
} from "../utils/calculations";
import { ibuTotal, ibuSingleAddition } from "../calculators/ibu";
import HopFlavorRadar from "../components/HopFlavorRadar";
import HopFlavorMini from "../components/HopFlavorMini";
import InputWithSuffix from "../components/InputWithSuffix";
import InlineEditableNumber from "../components/InlineEditableNumber";
import WaterSaltsCalc from "../components/WaterSaltsCalc";
import YeastPitchCalc from "../components/YeastPitchCalc";
import FitToWidth from "../components/FitToWidth";
import { estimateRecipeHopFlavor } from "../utils/hopsFlavor";
import {
  addCustomHop,
  getGrainPresets,
  getHopPresets,
  getYeastPresets,
} from "../utils/presets";
import type { Recipe } from "../hooks/useRecipeStore";
import { getBjcpCategories, findBjcpStyleByCode } from "../utils/bjcp";
import { getBjcpStyleSpec } from "../utils/bjcpSpecs";

function WaterSaltsSection({
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

export default function RecipeBuilder() {
  const upsert = useRecipeStore((s) => s.upsert);
  const [name, setName] = useState("New Recipe");
  const [bjcpStyleCode, setBjcpStyleCode] = useState<string>("");
  const bjcpStyle = useMemo(
    () => findBjcpStyleByCode(bjcpStyleCode || ""),
    [bjcpStyleCode]
  );
  const [showStyleInfo, setShowStyleInfo] = useState(false);
  const [batchVolumeL, setBatchVolumeL] = useState(20);
  // Legacy fg state removed; we use fgUsed/fgEstimated for display and saving
  const [efficiencyPct, setEfficiencyPct] = useState(72); // brewhouse efficiency percentage
  const [grains, setGrains] = useState<GrainItem[]>([
    {
      id: crypto.randomUUID(),
      name: "Pale Malt",
      weightKg: 4,
      colorLovibond: 2,
      potentialGu: 34.5,
      type: "grain",
    },
  ]);
  const [hops, setHops] = useState<HopItem[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      grams: 0,
      alphaAcidPercent: 0,
      timeMin: 60,
      type: "boil",
    },
  ]);
  const [yeast, setYeast] = useState<YeastItem>({
    name: "SafAle US-05",
    attenuationPercent: 0.78,
  });
  // const [showCustomGrainInput, setShowCustomGrainInput] = useState(false);
  const [showCustomHopInput, setShowCustomHopInput] = useState(false);
  const [showFlavorVisualizer, setShowFlavorVisualizer] = useState(false);

  // Water profile/volumes inputs
  const [mashThicknessLPerKg, setMashThicknessLPerKg] = useState(3);
  const [grainAbsorptionLPerKg, setGrainAbsorptionLPerKg] = useState(0.8);
  const [mashTunDeadspaceL, setMashTunDeadspaceL] = useState(0.5);
  const [mashTunCapacityL, setMashTunCapacityL] = useState<number | undefined>(
    undefined
  );
  const [boilTimeMin, setBoilTimeMin] = useState(60);
  const [boilOffRateLPerHour, setBoilOffRateLPerHour] = useState(3);
  const [showWaterSettings, setShowWaterSettings] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const batchRef = useRef<HTMLDivElement | null>(null);
  const [showIbuDetails, setShowIbuDetails] = useState(false);
  const ibuRef = useRef<HTMLDivElement | null>(null);
  const [hoverOpen, _setHoverOpen] = useState(false);
  const [hoverAllowed, setHoverAllowed] = useState(true);
  const hoverDisableTimerRef = useRef<number | null>(null);
  const [brewMethod, setBrewMethod] = useState<
    "three-vessel" | "biab-full" | "biab-sparge"
  >("three-vessel");
  const [coolingShrinkagePercent, setCoolingShrinkagePercent] = useState(4);
  const [kettleLossL, setKettleLossL] = useState(0.5);
  const [chillerLossL, setChillerLossL] = useState(0);
  // Mash schedule (affects fermentability)
  const [mashSteps, setMashSteps] = useState<
    {
      id: string;
      type: "infusion" | "decoction" | "ramp";
      tempC: number;
      timeMin: number;
      decoctionPercent?: number; // only for type 'decoction'
    }[]
  >([
    {
      id: crypto.randomUUID(),
      type: "infusion",
      tempC: 66,
      timeMin: 60,
    },
  ]);
  // Gravity auto/manual toggles and manual entries
  const [ogAuto, setOgAuto] = useState(true);
  const [actualOg, setActualOg] = useState<number | undefined>(undefined);
  const [fgAuto, setFgAuto] = useState(true);
  const [actualFg, setActualFg] = useState<number | undefined>(undefined);
  // Fermentation parameters for FG estimation
  const [fermentTempC] = useState(20);
  const [fermentDays] = useState(14);

  // Handlers to toggle auto/manual and capture current values when switching to manual
  const onToggleOgAuto = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOgAuto((prev) => {
      const next = !prev;
      if (!next) {
        // entering manual → freeze current auto value only if no prior manual entry
        if (actualOg == null) setActualOg(ogAutoCalc);
      }
      return next;
    });
  };
  const onToggleFgAuto = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFgAuto((prev) => {
      const next = !prev;
      if (!next) {
        if (actualFg == null) setActualFg(fgEstimated);
      }
      return next;
    });
  };

  const sortedHopPresets = useMemo(() => {
    const presets = getHopPresets();
    const categories = Array.from(
      new Set(presets.map((p) => p.category))
    ).filter(Boolean) as string[];
    categories.sort((a, b) => a.localeCompare(b));

    const grouped: Record<string, typeof presets> = {};
    categories.forEach((cat) => (grouped[cat] = []));

    // Ensure 'Other' category exists for hops without a category
    if (!grouped["Other"]) {
      grouped["Other"] = [];
    }

    presets.forEach((p) => {
      if (p.category) {
        grouped[p.category].push(p);
      } else {
        grouped["Other"].push(p);
      }
    });

    // Sort hops within each category alphabetically
    for (const category in grouped) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, []);

  const sortedYeastPresets = useMemo(() => {
    const presets = getYeastPresets();
    const categories = Array.from(
      new Set(presets.map((p) => p.category))
    ).filter(Boolean) as string[];
    categories.sort((a, b) => a.localeCompare(b));

    const grouped: Record<string, typeof presets> = {};
    categories.forEach((cat) => (grouped[cat] = []));

    // Ensure 'Other' category exists for yeasts without a category
    if (!grouped["Other"]) {
      grouped["Other"] = [];
    }

    presets.forEach((p) => {
      if (p.category) {
        grouped[p.category].push(p);
      } else {
        grouped["Other"].push(p);
      }
    });

    // Sort yeasts within each category alphabetically
    for (const category in grouped) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, []);

  // Color (SRM)
  const srm = useMemo(
    () => srmMoreyFromMcu(mcuFromGrainBill(grains, batchVolumeL)),
    [grains, batchVolumeL]
  );
  const color = useMemo(() => srmToHex(srm), [srm]);

  // Auto OG calculation
  const ogAutoCalc = useMemo(
    () =>
      ogFromPoints(
        pointsFromGrainBill(
          grains.map((g) => ({
            weightKg: g.weightKg,
            potentialGu: g.potentialGu,
            type: g.type,
          })),
          batchVolumeL,
          efficiencyPct / 100
        )
      ),
    [grains, batchVolumeL, efficiencyPct]
  );
  const ogUsed = useMemo(
    () => (ogAuto ? ogAutoCalc : actualOg ?? ogAutoCalc),
    [ogAuto, actualOg, ogAutoCalc]
  );

  // FG estimation based on yeast attenuation, temp and time
  const fgEstimated = useMemo(() => {
    const baseAtt = yeast.attenuationPercent ?? 0.75; // decimal
    // Use steps if provided; otherwise assume a single 66C/60m step (no change)
    let stepTimeTotal = 0;
    let tempAdjAcc = 0;
    let decoAdjAcc = 0;
    for (const s of mashSteps) {
      const t = Math.max(0, s.timeMin || 0);
      stepTimeTotal += t;
      tempAdjAcc += (66 - (s.tempC || 66)) * 0.006 * t;
      if (s.type === "decoction") decoAdjAcc += 0.005 * t;
    }
    const avgTempAdj = stepTimeTotal > 0 ? tempAdjAcc / stepTimeTotal : 0;
    const avgDecoAdj = stepTimeTotal > 0 ? decoAdjAcc / stepTimeTotal : 0;
    const totalMashTime = stepTimeTotal > 0 ? stepTimeTotal : 60;
    const mashTimeAdj = Math.max(
      -0.03,
      Math.min(0.03, ((totalMashTime - 60) / 15) * 0.005)
    );

    let effAtt =
      baseAtt +
      avgTempAdj +
      avgDecoAdj +
      mashTimeAdj +
      (fermentTempC - 20) * 0.004 +
      (fermentDays - 10) * 0.002;
    effAtt = Math.max(0.6, Math.min(0.95, effAtt));
    return 1 + (ogUsed - 1) * (1 - effAtt);
  }, [yeast.attenuationPercent, fermentTempC, fermentDays, ogUsed, mashSteps]);
  const fgUsed = useMemo(
    () => (fgAuto ? fgEstimated : actualFg ?? fgEstimated),
    [fgAuto, actualFg, fgEstimated]
  );
  const abv = useMemo(() => abvSimple(ogUsed, fgUsed), [ogUsed, fgUsed]);

  const ibu = useMemo(
    () =>
      ibuTotal(
        hops.map((h) => ({
          weightGrams: h.grams,
          alphaAcidPercent: h.alphaAcidPercent,
          boilTimeMinutes: h.timeMin,
          type: h.type,
          whirlpoolTimeMinutes: h.whirlpoolTimeMin,
          whirlpoolTempC: h.whirlpoolTempC,
        })),
        batchVolumeL,
        ogUsed
      ),
    [hops, batchVolumeL, ogUsed]
  );

  // Water calculations (live)
  const totalGrainKg = useMemo(() => totalGrainWeightKg(grains), [grains]);
  const waterParams = useMemo<WaterParams>(
    () => ({
      mashThicknessLPerKg,
      grainAbsorptionLPerKg,
      mashTunDeadspaceL,
      mashTunCapacityL,
      boilTimeMin,
      boilOffRateLPerHour,
      // Brewfather-style always on
      coolingShrinkagePercent,
      kettleLossL,
      chillerLossL,
    }),
    [
      mashThicknessLPerKg,
      grainAbsorptionLPerKg,
      mashTunDeadspaceL,
      mashTunCapacityL,
      boilTimeMin,
      boilOffRateLPerHour,
      coolingShrinkagePercent,
      kettleLossL,
      chillerLossL,
    ]
  );
  const preBoilVolumeL = useMemo(
    () => computePreBoilVolumeL(batchVolumeL, waterParams),
    [batchVolumeL, waterParams]
  );
  const mashWaterL = useMemo(
    () => computeMashWaterL(totalGrainKg, waterParams),
    [totalGrainKg, waterParams]
  );
  const spargeWaterL = useMemo(
    () => computeSpargeWaterL(totalGrainKg, batchVolumeL, waterParams),
    [totalGrainKg, batchVolumeL, waterParams]
  );

  // Mash/sparge finalization with optional BIAB logic and capacity capping
  const absorptionL = useMemo(
    () => Math.max(0, grainAbsorptionLPerKg) * totalGrainKg,
    [grainAbsorptionLPerKg, totalGrainKg]
  );
  const deadspaceL = useMemo(
    () => Math.max(0, mashTunDeadspaceL),
    [mashTunDeadspaceL]
  );

  const desiredMashFullVolumeL = useMemo(
    () => preBoilVolumeL + absorptionL + deadspaceL,
    [preBoilVolumeL, absorptionL, deadspaceL]
  );

  const { finalMashL, finalSpargeL, capacityExceeded } = useMemo(() => {
    const capacity = mashTunCapacityL;
    if (brewMethod === "biab-full") {
      let usedMash = desiredMashFullVolumeL;
      let usedSparge = 0;
      if (capacity && usedMash > capacity) {
        usedMash = capacity;
        usedSparge = computeSpargeFromMashUsedL(
          totalGrainKg,
          batchVolumeL,
          waterParams,
          usedMash
        );
        return {
          finalMashL: usedMash,
          finalSpargeL: usedSparge,
          capacityExceeded: true,
        };
      }
      return {
        finalMashL: usedMash,
        finalSpargeL: usedSparge,
        capacityExceeded: false,
      };
    }
    // three-vessel or biab-sparge -> thickness-based mash, with capacity cap
    if (capacity && mashWaterL > capacity) {
      const usedMash = capacity;
      const usedSparge = computeSpargeFromMashUsedL(
        totalGrainKg,
        batchVolumeL,
        waterParams,
        usedMash
      );
      return {
        finalMashL: usedMash,
        finalSpargeL: usedSparge,
        capacityExceeded: true,
      };
    }
    return {
      finalMashL: mashWaterL,
      finalSpargeL: spargeWaterL,
      capacityExceeded: false,
    };
  }, [
    brewMethod,
    mashTunCapacityL,
    desiredMashFullVolumeL,
    mashWaterL,
    spargeWaterL,
    totalGrainKg,
    batchVolumeL,
    waterParams,
  ]);

  // (kept inlined where used to avoid dead code)

  // Collect distinct hop flavor series (all)
  const hopFlavorSeries = useMemo(() => {
    const seen = new Set<string>();
    const series: { name: string; flavor: NonNullable<HopItem["flavor"]> }[] =
      [];
    for (const h of hops) {
      if (!h.name || !h.flavor || seen.has(h.name)) continue;
      seen.add(h.name);
      series.push({ name: h.name, flavor: h.flavor });
    }
    return series;
  }, [hops]);

  const estimatedTotalFlavor = useMemo(
    () => estimateRecipeHopFlavor(hops, batchVolumeL),
    [hops, batchVolumeL]
  );

  const hasSecondTiming = useMemo(
    () => hops.some((x) => x.type === "dry hop" || x.type === "whirlpool"),
    [hops]
  );
  const hasDecoctionStep = useMemo(
    () => mashSteps.some((s) => s.type === "decoction"),
    [mashSteps]
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showBatchDetails) return;
      const target = e.target as Node | null;
      if (batchRef.current && target && !batchRef.current.contains(target)) {
        setShowBatchDetails(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [showBatchDetails]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showIbuDetails) return;
      const target = e.target as Node | null;
      if (ibuRef.current && target && !ibuRef.current.contains(target)) {
        setShowIbuDetails(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [showIbuDetails]);

  useEffect(() => {
    return () => {
      if (hoverDisableTimerRef.current) {
        window.clearTimeout(hoverDisableTimerRef.current);
        hoverDisableTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="page-recipe max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Recipe Builder
          </h1>
          <p className="mt-1 text-muted text-sm">
            Inline stats update as you type.
          </p>
        </div>
        <button
          className="btn-neon"
          onClick={() => {
            const recipe: Recipe = {
              id: crypto.randomUUID(),
              name,
              createdAt: new Date().toISOString(),
              bjcpStyleCode: bjcpStyleCode || undefined,
              batchVolumeL,
              targetOG: ogUsed,
              targetFG: fgUsed,
              grains,
              hops,
              yeast,
              mash: { steps: mashSteps },
              water: {
                ...waterParams,
                mashWaterL,
                spargeWaterL,
                preBoilVolumeL,
              },
            };
            upsert(recipe);
          }}
        >
          Save Recipe
        </button>
      </div>

      <section className="section-soft grid grid-cols-1 sm:grid-cols-4 gap-4 ">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
          <label className="block">
            <div className="text-sm text-white/50 mb-1">Name</div>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <div className="text-sm  text-white/50 mb-1">
            Target Batch Volume (L)
          </div>
          <input
            type="number"
            step="0.1"
            className="w-full rounded-md border px-3 py-2"
            value={batchVolumeL}
            onChange={(e) => setBatchVolumeL(Number(e.target.value))}
          />
        </label>
        <label className="block">
          <div className="text-sm  text-white/50  mb-1">
            Brewhouse Efficiency (%)
          </div>
          <input
            type="number"
            step="1"
            min="40"
            max="95"
            className="w-full rounded-md border px-3 py-2"
            value={efficiencyPct}
            onChange={(e) => setEfficiencyPct(Number(e.target.value))}
          />
        </label>
        {/* Row with Style toggle + OG + FG */}
        <div className="sm:col-span-2">
          <div className="relative">
            <div className="w-full rounded-md border border-transparent px-1 py-1 text-left hover:bg-white/5">
              <span className="text-sm text-white/60">
                Style:{" "}
                <span className="italic">
                  {bjcpStyle ? `${bjcpStyle.code}. ${bjcpStyle.name}` : "None"}
                </span>
              </span>
            </div>
            <select
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={bjcpStyleCode}
              onChange={(e) => setBjcpStyleCode(e.target.value)}
              aria-label="Select BJCP style"
            >
              <option value="">None</option>
              {getBjcpCategories().map((cat) => (
                <optgroup key={cat.code} label={`${cat.code}. ${cat.name}`}>
                  {cat.styles.map((s) => (
                    <option
                      key={s.code}
                      value={s.code}
                    >{`${s.code}. ${s.name}`}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="mt-1">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-white/40 hover:bg-white/20 shadow-lg shadow-black/30 hover:shadow-sm"
              onClick={() => setShowStyleInfo((v) => !v)}
            >
              {showStyleInfo ? "Hide Style Info" : "Open Style Info"}
            </button>
          </div>
        </div>
        <label className="block sm:col-start-3">
          <div className="text-sm  text-white/50 mb-1">
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={onToggleOgAuto}
            >
              {ogAuto ? "Target OG (auto)" : "Actual OG"}
            </button>
          </div>
          <input
            type="number"
            step="0.001"
            min="1.000"
            max="1.2"
            className="w-full rounded-md border px-3 py-2"
            value={(ogAuto ? ogAutoCalc : actualOg ?? ogAutoCalc).toFixed(3)}
            onChange={(e) => !ogAuto && setActualOg(Number(e.target.value))}
            placeholder="1.050"
            readOnly={ogAuto}
          />
        </label>
        <label className="block sm:col-start-4">
          <div className="text-sm  text-white/50 mb-1">
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={onToggleFgAuto}
            >
              {fgAuto ? "Target FG (auto)" : "Actual FG"}
            </button>
          </div>
          <input
            type="number"
            step="0.001"
            min="0.990"
            max="1.2"
            className="w-full rounded-md border px-3 py-2"
            value={(fgAuto ? fgEstimated : actualFg ?? fgEstimated).toFixed(3)}
            onChange={(e) => !fgAuto && setActualFg(Number(e.target.value))}
            placeholder="1.010"
            readOnly={fgAuto}
          />
        </label>
        <div className="sm:col-span-4">
          <Collapsible open={showStyleInfo}>
            <StyleRangeBars
              styleCode={bjcpStyle?.code}
              abv={abv}
              og={ogUsed}
              fg={fgUsed}
              ibu={ibu}
              srm={srm}
            />
          </Collapsible>
        </div>
      </section>

      {/* Water settings (hidden by default) */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          Water is automatic from grains + target volume.
        </div>
        <button
          className="text-sm underline underline-offset-4 hover:text-white/90"
          onClick={() => setShowWaterSettings((v) => !v)}
        >
          {showWaterSettings ? "Hide water settings" : "Show water settings"}
        </button>
      </div>
      {showWaterSettings && (
        <section className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Mash Thickness</div>
            <InputWithSuffix
              value={mashThicknessLPerKg}
              onChange={(n) => setMashThicknessLPerKg(n)}
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
              value={brewMethod}
              onChange={(e) =>
                setBrewMethod(
                  e.target.value as "three-vessel" | "biab-full" | "biab-sparge"
                )
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
              value={grainAbsorptionLPerKg}
              onChange={(n) => setGrainAbsorptionLPerKg(n)}
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
              value={mashTunDeadspaceL}
              onChange={(n) => setMashTunDeadspaceL(n)}
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
              value={mashTunCapacityL ?? 0}
              onChange={(n) =>
                setMashTunCapacityL(Number.isFinite(n) && n > 0 ? n : undefined)
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
              value={boilTimeMin}
              onChange={(n) => setBoilTimeMin(n)}
              suffix=" min"
              suffixClassName="right-3 text-[10px]"
              step={5}
              placeholder="60"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Boil-off Rate</div>
            <InputWithSuffix
              value={boilOffRateLPerHour}
              onChange={(n) => setBoilOffRateLPerHour(n)}
              suffix=" L/hr"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="3.0"
            />
          </label>
          {/* Split loss fields (always on) */}
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">
              Cooling Shrinkage (%)
            </div>
            <InlineEditableNumber
              value={coolingShrinkagePercent}
              onChange={(n) => setCoolingShrinkagePercent(n)}
              suffix="%"
              suffixClassName="left-9 right-0.5 text-[10px]"
              step={0.1}
              placeholder="4"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Kettle Loss</div>
            <InputWithSuffix
              value={kettleLossL}
              onChange={(n) => setKettleLossL(n)}
              suffix=" L"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="0.5"
            />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-700 mb-1">Chiller Loss</div>
            <InputWithSuffix
              value={chillerLossL}
              onChange={(n) => setChillerLossL(n)}
              suffix=" L"
              suffixClassName="right-3 text-[10px]"
              step={0.1}
              placeholder="0"
            />
          </label>
        </section>
      )}

      {capacityExceeded && (
        <div className="rounded-md border border-amber-400/50 bg-amber-200/50 p-3 text-sm text-amber-900">
          Mash water exceeds mash tun capacity ({mashTunCapacityL?.toFixed(1)}{" "}
          L). Using {finalMashL.toFixed(1)} L mash and {finalSpargeL.toFixed(1)}{" "}
          L sparge.
        </div>
      )}

      {/* Sticky summary bar (glass + warm accent) */}
      <div className="sticky top-14 z-10 mx-auto max-w-6xl py-2 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/40 px-3 py-2 shadow-soft ring-1 ring-neutral-900/5 supports-[backdrop-filter]:bg-white/25">
          <div className="flex items-center gap-2 text-sm font-medium tracking-tight text-white/50 shrink-0">
            <span>{name}</span>
            {/* {bjcpStyle && (
              <span
                className="rounded-md border border-white/10 bg-white/30 px-2 py-0.5 text-xs text-neutral-800 shadow-soft"
                title={`${bjcpStyle.code}. ${bjcpStyle.name}`}
              >
                {bjcpStyle.code}
              </span>
            )} */}
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
              <div className="relative group" ref={ibuRef}>
                <div
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 pr-8 py-1.5 text-sm shadow-soft relative cursor-pointer select-none shadow-lg shadow-black/30 hover:shadow-sm"
                  onClick={() => setShowIbuDetails((v) => !v)}
                  aria-expanded={showIbuDetails}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowIbuDetails((v) => !v);
                    }
                  }}
                >
                  <span className="text-neutral-600">IBU</span>
                  <span className="font-semibold tracking-tight text-neutral-900">
                    {ibu.toFixed(0)}
                  </span>
                  <HopFlavorMini
                    flavor={estimatedTotalFlavor}
                    size={40}
                    maxValue={5}
                    className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2"
                  />
                </div>
                <div
                  className={
                    "absolute right-0 mt-2 z-20 " +
                    (showIbuDetails ? "block" : "hidden") +
                    " group-hover:block"
                  }
                >
                  <div className="relative rounded-xl border border-white/10 ring-1 ring-white/60 bg-white/90 p-2 shadow-2xl shadow-black/30 backdrop-blur-3xl supports-[backdrop-filter]:bg-white/70">
                    <div className="absolute right-6 -top-2 h-0 w-0 border-l-6 border-r-6 border-b-8 border-l-transparent border-r-transparent border-b-white/90" />
                    <div className="rounded-lg bg-neutral-900 p-2">
                      <HopFlavorRadar
                        series={[
                          {
                            name: "Total (est.)",
                            flavor: estimatedTotalFlavor,
                          },
                        ]}
                        colorStrategy="dominant"
                        labelColorize={true}
                        showLegend={false}
                        ringRadius={100}
                        outerPadding={80}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Batch volume with click-to-toggle details */}
              <div
                className="relative"
                ref={batchRef}
                onMouseEnter={() => hoverAllowed && _setHoverOpen(true)}
                onMouseLeave={() => _setHoverOpen(false)}
              >
                <div
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/50 px-3 py-1.5 text-sm shadow-soft cursor-pointer select-none shadow-lg shadow-black/30 hover:shadow-sm"
                  onClick={() => {
                    if (showBatchDetails) {
                      setShowBatchDetails(false);
                      setHoverAllowed(false);
                      if (hoverDisableTimerRef.current) {
                        window.clearTimeout(hoverDisableTimerRef.current);
                      }
                      hoverDisableTimerRef.current = window.setTimeout(() => {
                        setHoverAllowed(true);
                        hoverDisableTimerRef.current = null;
                      }, 600);
                    } else {
                      setShowBatchDetails(true);
                    }
                  }}
                  aria-expanded={showBatchDetails}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (showBatchDetails) {
                        setShowBatchDetails(false);
                        setHoverAllowed(false);
                        if (hoverDisableTimerRef.current) {
                          window.clearTimeout(hoverDisableTimerRef.current);
                        }
                        hoverDisableTimerRef.current = window.setTimeout(() => {
                          setHoverAllowed(true);
                          hoverDisableTimerRef.current = null;
                        }, 600);
                      } else {
                        setShowBatchDetails(true);
                      }
                    }
                  }}
                >
                  <span className="text-neutral-600">Batch</span>
                  <span className="font-semibold tracking-tight text-neutral-900">
                    {batchVolumeL.toFixed(1)} L
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={
                      "h-3 w-3 text-neutral-600 transition-transform duration-200 " +
                      (showBatchDetails ? "rotate-180" : "")
                    }
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 9l6 6 6-6"
                    />
                  </svg>
                </div>
                <div
                  className={
                    "absolute right-0 mt-2 z-20 " +
                    (showBatchDetails || (hoverAllowed && hoverOpen)
                      ? "block"
                      : "hidden")
                  }
                >
                  <div className="relative flex items-center justify-end gap-2">
                    <div className="absolute right-6 -top-2 h-0 w-0 border-l-6 border-r-6 border-b-8 border-l-transparent border-r-transparent border-b-white/20" />
                    <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 ring-1 ring-white/50 bg-white/90 px-3 py-1.5 text-xs shadow-2xl shadow-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70">
                      <span
                        className="text-neutral-600"
                        style={{ WebkitTextStroke: "0.6px rgba(0,0,0,0.9)" }}
                      >
                        Pre-boil
                      </span>
                      <span className="font-semibold tracking-tight text-neutral-900">
                        {preBoilVolumeL.toFixed(1)} L
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 ring-1 ring-white/50 bg-white/90 px-3 py-1.5 text-xs shadow-2xl shadow-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70">
                      <span
                        className="text-neutral-600"
                        style={{ WebkitTextStroke: "0.6px rgba(0,0,0,0.9)" }}
                      >
                        Mash / Sparge
                      </span>
                      <span className="font-semibold tracking-tight text-neutral-900">
                        {finalMashL.toFixed(1)} / {finalSpargeL.toFixed(1)} L
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FitToWidth>
        </div>
      </div>

      <section className="section-soft space-y-3 pb-1 sm:pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-semibold text-primary-strong">Grain Bill</div>
          <button
            className="hidden sm:block btn-neon"
            onClick={() =>
              setGrains((gs) => [
                ...gs,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  weightKg: 0,
                  colorLovibond: 2,
                  potentialGu: 34,
                  type: "grain",
                },
              ])
            }
          >
            + Add Grain
          </button>
        </div>
        <div className="hidden sm:grid gap-2 text-xs text-muted sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,.5fr)_min-content]">
          <div>Grain</div>
          <div>Weight</div>
          <div>Grain %</div>
          <div></div> {/* For the remove button */}
        </div>
        {grains.map((g, i) => (
          <div
            key={g.id}
            className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,.5fr)_min-content] gap-2"
          >
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">Grain</div>
              <div className="relative">
                <select
                  className="w-full rounded-md border py-2.5 pl-2 pr-12"
                  onChange={(e) => {
                    if (e.target.value === "__add_custom__") {
                      return;
                      // Optionally reset the current grain item or set a placeholder
                    } else {
                      const preset = getGrainPresets().find(
                        (p) => p.name === e.target.value
                      );
                      if (!preset) return;
                      const c = [...grains];
                      c[i] = {
                        ...g,
                        name: preset.name,
                        colorLovibond: (preset as { colorLovibond: number })
                          .colorLovibond,
                        potentialGu: (preset as { potentialGu: number })
                          .potentialGu,
                        type: "grain",
                      } as GrainItem;
                      setGrains(c);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Grains...
                  </option>
                  {getGrainPresets().map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__add_custom__">+ Add Custom Grain</option>
                </select>
                <div
                  className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-xs text-neutral-600 px-2 py-0.5"
                  aria-hidden="true"
                >
                  {g.colorLovibond}°L
                </div>
              </div>
            </label>
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">
                Weight (kg)
              </div>
              <InputWithSuffix
                value={g.weightKg}
                onChange={(n) => {
                  const c = [...grains];
                  c[i] = { ...g, weightKg: n };
                  setGrains(c);
                }}
                suffix=" kg"
                suffixClassName="right-3 text-[10px]"
                step={0.01}
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col">
              <div className="text-xs text-muted mb-1 sm:hidden">
                Grain Bill (%)
              </div>
              <div className="rounded-md border px-3 py-2 bg-white/40 text-sm">
                {totalGrainKg > 0
                  ? ((g.weightKg / totalGrainKg) * 100).toFixed(1)
                  : "0.0"}
                %
              </div>
            </label>
            <div className="flex justify-end items-center">
              <button
                className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
                onClick={() =>
                  setGrains((currentGrains) =>
                    currentGrains.filter((grain) => grain.id !== g.id)
                  )
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <button
          className="block sm:hidden w-full btn-neon"
          onClick={() =>
            setGrains((gs) => [
              ...gs,
              {
                id: crypto.randomUUID(),
                name: "",
                weightKg: 0,
                colorLovibond: 2,
                potentialGu: 34,
                type: "grain",
              },
            ])
          }
        >
          + Add Grain
        </button>
      </section>

      {/* Mash schedule */}
      <section className="section-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-semibold text-primary-strong">Mash Schedule</div>
          <button
            className="hidden sm:block btn-neon"
            onClick={() =>
              setMashSteps((xs) => [
                ...xs,
                {
                  id: crypto.randomUUID(),
                  type: "infusion" as const,
                  tempC: 66,
                  timeMin: 15,
                },
              ])
            }
          >
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
          {mashSteps.map((s, i) => (
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
                  onChange={(e) => {
                    const c = [...mashSteps];
                    c[i] = { ...s, type: e.target.value as typeof s.type };
                    setMashSteps(c);
                  }}
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
                  onChange={(n) => {
                    const c = [...mashSteps];
                    c[i] = { ...s, tempC: n };
                    setMashSteps(c);
                  }}
                  step={0.5}
                  suffix="°C"
                  suffixClassName="right-3 text-[10px]"
                />
              </label>
              <label className="block">
                <div className="text-xs text-muted mb-1 sm:hidden">Time</div>
                <InputWithSuffix
                  value={s.timeMin}
                  onChange={(n) => {
                    const c = [...mashSteps];
                    c[i] = { ...s, timeMin: n };
                    setMashSteps(c);
                  }}
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
                      onChange={(n) => {
                        const c = [...mashSteps];
                        c[i] = { ...s, decoctionPercent: n };
                        setMashSteps(c);
                      }}
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
                  onClick={() =>
                    setMashSteps((xs) => xs.filter((x) => x.id !== s.id))
                  }
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            className="block sm:hidden w-full btn-neon"
            onClick={() =>
              setMashSteps((xs) => [
                ...xs,
                {
                  id: crypto.randomUUID(),
                  type: "infusion" as const,
                  tempC: 66,
                  timeMin: 15,
                },
              ])
            }
          >
            + Add Step
          </button>
        </div>
      </section>

      <section className="section-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-semibold text-primary-strong">Hop Schedule</div>
          <button
            className="hidden sm:block btn-neon"
            onClick={() =>
              setHops((hs) => [
                ...hs,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  grams: 0,
                  alphaAcidPercent: 0,
                  timeMin: 60,
                  type: "boil", // Default to 'boil'
                },
              ])
            }
          >
            + Add Hop
          </button>
        </div>
        <div
          className={
            "hidden sm:grid gap-2 text-xs text-muted " +
            (hasSecondTiming
              ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]"
              : "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]")
          }
        >
          <div>Hop</div>
          <div>Alpha %</div>
          <div>Method</div>
          <div>Timing A</div>
          {hasSecondTiming && <div>Timing B</div>}
          <div>Amount</div>
          <div></div> {/* For the remove button */}
        </div>
        {hops.map((h, i) => {
          const perHopIbu = ibuSingleAddition(
            {
              weightGrams: h.grams,
              alphaAcidPercent: h.alphaAcidPercent,
              boilTimeMinutes: h.timeMin ?? 0,
              type: h.type,
              whirlpoolTimeMinutes: h.whirlpoolTimeMin,
              whirlpoolTempC: h.whirlpoolTempC,
            },
            batchVolumeL,
            ogUsed
          );
          const gramsPerLiter = batchVolumeL > 0 ? h.grams / batchVolumeL : 0;
          return (
            <div
              key={h.id ?? i}
              className={
                "grid grid-cols-1 gap-2 " +
                (hasSecondTiming
                  ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]"
                  : "sm:grid-cols-[minmax(0,1fr)_minmax(0,.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]")
              }
            >
              <label className="flex flex-col sm:order-1">
                <div className="text-xs text-muted mb-1 sm:hidden">Hop</div>
                <select
                  className="w-full rounded-md border px-2 py-2.5"
                  onChange={(e) => {
                    if (e.target.value === "__add_custom__") {
                      setShowCustomHopInput(true);
                    } else {
                      const preset = getHopPresets().find(
                        (p) => p.name === e.target.value
                      );
                      if (!preset) return;
                      const c = [...hops];
                      c[i] = {
                        ...h,
                        name: preset.name,
                        alphaAcidPercent: preset.alphaAcidPercent,
                        category: preset.category, // Set the category here
                        flavor: preset.flavor,
                      } as HopItem;
                      setHops(c);
                      setShowCustomHopInput(false);
                    }
                  }}
                  defaultValue={h.name}
                >
                  <option value="" disabled>
                    Hops...
                  </option>
                  {Object.entries(sortedHopPresets).map(
                    ([category, hopsInCat]) => (
                      <optgroup key={category} label={category}>
                        {hopsInCat.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  )}
                  <option value="__add_custom__">+ Add Custom Hop</option>
                </select>
                <div className="mt-1 text-[11px] text-white/50 translate-x-2">
                  {perHopIbu.toFixed(1)} IBU • {gramsPerLiter.toFixed(2)} g/L
                </div>
              </label>
              <label className="flex flex-col sm:order-3">
                <div className="text-xs text-muted mb-1 sm:hidden">Type</div>
                <select
                  className="w-full rounded-md border px-2 py-2.5"
                  value={h.type}
                  onChange={(e) => {
                    const c = [...hops];
                    c[i] = { ...h, type: e.target.value as HopTimingType };
                    setHops(c);
                  }}
                >
                  <option value="boil">Boil</option>
                  <option value="dry hop">Dry Hop</option>
                  <option value="whirlpool">Whirlpool</option>
                  <option value="first wort">First Wort</option>
                  <option value="mash">Mash</option>
                </select>
              </label>
              {/* Grams (moved up to match header order) */}
              <label className="flex flex-col sm:order-6">
                <div className="text-xs text-muted mb-1 sm:hidden">Grams</div>
                <InputWithSuffix
                  value={h.grams}
                  onChange={(n) => {
                    const c = [...hops];
                    c[i] = { ...h, grams: n } as HopItem;
                    setHops(c);
                  }}
                  suffix=" g"
                  suffixClassName="right-3 text-[10px]"
                  step={0.1}
                  placeholder="10"
                />
              </label>
              {/* Alpha % (moved up to match header order) */}
              <label className="flex flex-col sm:order-2">
                <div className="text-xs text-muted mb-1 sm:hidden">Alpha %</div>
                <InlineEditableNumber
                  value={h.alphaAcidPercent}
                  onChange={(n) => {
                    const c = [...hops];
                    c[i] = { ...h, alphaAcidPercent: n } as HopItem;
                    setHops(c);
                  }}
                  suffix="%"
                  suffixClassName="left-9 right-0.5 text-[10px]"
                  step={0.1}
                  placeholder="12"
                />
              </label>
              {/* Timing A column */}
              <label className="flex flex-col sm:order-4">
                <div className="text-xs text-muted mb-1 sm:hidden">
                  Timing A
                </div>
                {h.type === "dry hop" ? (
                  <select
                    className="w-full rounded-md border px-2 py-2.5"
                    value={h.dryHopStage ?? "primary"}
                    onChange={(e) => {
                      const c = [...hops];
                      c[i] = {
                        ...h,
                        dryHopStage: e.target.value as
                          | "primary"
                          | "post-fermentation"
                          | "keg",
                      } as HopItem;
                      setHops(c);
                    }}
                  >
                    <option value="primary">Primary</option>
                    <option value="post-fermentation">Post-Fermentation</option>
                    <option value="keg">Keg</option>
                  </select>
                ) : h.type === "whirlpool" ? (
                  <InputWithSuffix
                    value={h.whirlpoolTempC ?? 80}
                    onChange={(n) => {
                      const c = [...hops];
                      c[i] = { ...h, whirlpoolTempC: n } as HopItem;
                      setHops(c);
                    }}
                    suffix="°C"
                    suffixClassName="right-3 text-[10px]"
                    step={0.1}
                    placeholder="80"
                  />
                ) : (
                  <InputWithSuffix
                    value={h.timeMin ?? 0}
                    onChange={(n) => {
                      const c = [...hops];
                      c[i] = { ...h, timeMin: n } as HopItem;
                      setHops(c);
                    }}
                    suffix=" min"
                    suffixClassName="right-3 text-[10px]"
                    step={1}
                    placeholder="60"
                  />
                )}
              </label>

              {/* Timing B column (only when grid includes it) */}
              {hasSecondTiming && (
                <label className="flex flex-col sm:order-5">
                  <div className="text-xs text-muted mb-1 sm:hidden">
                    Timing B
                  </div>
                  {h.type === "dry hop" ? (
                    <InputWithSuffix
                      value={h.dryHopDays ?? 3}
                      onChange={(n) => {
                        const c = [...hops];
                        c[i] = { ...h, dryHopDays: n } as HopItem;
                        setHops(c);
                      }}
                      suffix=" days"
                      suffixClassName="right-3 text-[10px]"
                      step={0.5}
                      placeholder="3"
                    />
                  ) : h.type === "whirlpool" ? (
                    <InputWithSuffix
                      value={h.whirlpoolTimeMin ?? 15}
                      onChange={(n) => {
                        const c = [...hops];
                        c[i] = { ...h, whirlpoolTimeMin: n } as HopItem;
                        setHops(c);
                      }}
                      suffix=" min"
                      suffixClassName="right-3 text-[10px]"
                      step={1}
                      placeholder="15"
                    />
                  ) : (
                    <div className="h-10" />
                  )}
                </label>
              )}
              {/* Remove generic time input; handled contextually above */}
              <div className="flex justify-end items-center sm:order-7">
                <button
                  className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
                  onClick={() =>
                    setHops((currentHops) =>
                      currentHops.filter((hop) => hop.id !== h.id)
                    )
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {showCustomHopInput && (
                <form
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 col-span-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement & {
                      hname: HTMLInputElement;
                      haa: HTMLInputElement;
                    };
                    const name = form.hname.value.trim();
                    const aa = Number(form.haa.value);
                    if (!name || !Number.isFinite(aa)) return;
                    addCustomHop({ name, alphaAcidPercent: aa });
                    form.reset();
                    setShowCustomHopInput(false);
                  }}
                >
                  <input
                    name="hname"
                    className="rounded-md border px-3 py-2"
                    placeholder="Hop name"
                  />
                  <input
                    name="haa"
                    type="number"
                    step="0.1"
                    className="rounded-md border px-3 py-2"
                    placeholder="Alpha %"
                  />
                  <button
                    className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
                    type="submit"
                  >
                    + Add Hop Preset
                  </button>
                </form>
              )}
            </div>
          );
        })}
        <button
          className="block sm:hidden w-full btn-neon"
          onClick={() =>
            setHops((hs) => [
              ...hs,
              {
                id: crypto.randomUUID(),
                name: "",
                grams: 0,
                alphaAcidPercent: 0,
                timeMin: 60,
                type: "boil",
              },
            ])
          }
        >
          + Add Hop
        </button>
        <div className="flex justify-end mt-3 sm:mt-4">
          <div className="inline-flex items-center gap-2">
            {/* {estimatedTotalFlavor && (
              <HopFlavorMini
                flavor={estimatedTotalFlavor}
                size={40}
                maxValue={5}
                className="hidden sm:block"
              />
            )} */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-white/40 hover:bg_WHITE/20 shadow-lg shadow-black/30 hover:shadow-sm"
              onClick={() => setShowFlavorVisualizer((v) => !v)}
            >
              {showFlavorVisualizer ? "Hide Visualizer" : "Show Visualizer"}
            </button>
          </div>
        </div>
        <Collapsible open={showFlavorVisualizer}>
          {hopFlavorSeries.length > 0 && (
            <FlavorGraphs
              baseSeries={hopFlavorSeries}
              estFlavor={estimatedTotalFlavor}
            />
          )}
        </Collapsible>
      </section>

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
              setYeast(preset);
            }}
          >
            <option value="" disabled>
              Select Yeast...
            </option>
            {Object.entries(sortedYeastPresets).map(
              ([category, yeastsInCat]) => (
                <optgroup key={category} label={category}>
                  {yeastsInCat.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )
            )}
          </select>
        </label>
        {yeast.attenuationPercent && (
          <div className="text-sm text-neutral-600">
            Est. Attenuation: {(yeast.attenuationPercent * 100).toFixed(0)}%
          </div>
        )}
        <div className="pt-1">
          <YeastPitchCalc og={ogUsed} volumeL={batchVolumeL} />
        </div>
      </section>

      <section className="section-soft space-y-3">
        <WaterSaltsSection
          mashWaterL={finalMashL}
          spargeWaterL={finalSpargeL}
        />
      </section>
    </div>
  );
}

function FlavorGraphs({
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

function StyleRangeBars({
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

  // SRM is computed elsewhere; we display SRM directly in the style info

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
    // Build a domain that extends beyond the BJCP range to show how far out-of-range we are
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
          {/* left out-of-range pad */}
          {range && minPct > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-red-900/50"
              style={{ width: `${minPct}%` }}
            />
          )}
          {/* style range fill */}
          {range && (
            <div
              className="absolute inset-y-0 bg-green-700/85"
              style={{
                left: `${minPct}%`,
                width: `${Math.max(0, maxPct - minPct)}%`,
              }}
            />
          )}
          {/* right out-of-range pad */}
          {range && maxPct < 100 && (
            <div
              className="absolute inset-y-0 right-0 bg-red-900/50"
              style={{ width: `${Math.max(0, 100 - maxPct)}%` }}
            />
          )}
          {/* current marker */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]"
            style={{ left: `${valPct}%` }}
            title={format(value)}
          />
          {/* end labels at exact min/max positions (if range present) */}
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
          {/* current value label near marker */}
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

  // BU/GU uses OG points
  const ogPoints = Math.max(0, Math.round((og - 1) * 1000));
  const buGu = ogPoints > 0 ? ibu / ogPoints : 0;
  // Derive a style BU/GU band when both IBU and OG ranges exist
  let buGuRange: [number, number] | undefined = undefined;
  if (spec?.ibu && spec?.og) {
    const ogMinPts = Math.max(1, Math.round((spec.og[0] - 1) * 1000));
    const ogMaxPts = Math.max(1, Math.round((spec.og[1] - 1) * 1000));
    const derivedMin = spec.ibu[0] / ogMaxPts; // lightest bitterness vs highest OG
    const derivedMax = spec.ibu[1] / ogMinPts; // highest bitterness vs lowest OG
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
