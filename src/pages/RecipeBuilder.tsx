import { useEffect, useMemo, useRef, useState } from "react";
import Collapsible from "../components/Collapsible";
import {
  useRecipeStore,
  type GrainItem,
  type HopItem,
  type YeastItem,
  type FermentationStep,
  type OtherIngredient,
  type OtherIngredientCategory,
} from "../hooks/useRecipeStore";
import { type WaterParams } from "../utils/calculations";
// per-hop IBU calc handled inside HopSchedule; keep total calc in hook
import FermentationSection from "../modules/recipe/components/FermentationSection";
import { getOtherIngredientPresets } from "../utils/presets";
import type { Recipe } from "../hooks/useRecipeStore";
import { findBjcpStyleByCode } from "../utils/bjcp";
import WaterSaltsSection from "../components/WaterSaltsSection";
import StyleRangeBars from "../components/StyleRangeBars";
import { useRecipeCalculations } from "../hooks/useRecipeCalculations";
import GrainBill from "../modules/recipe/components/GrainBill";
import HopSchedule from "../modules/recipe/components/HopSchedule";
import MashSchedule from "../modules/recipe/components/MashSchedule";
import OtherIngredients from "../modules/recipe/components/OtherIngredients";
import StyleSelector from "../modules/recipe/components/StyleSelector";
import YeastSection from "../modules/recipe/components/YeastSection";
import BatchSummary from "../modules/recipe/components/BatchSummary";
import WaterSettings from "../modules/recipe/components/WaterSettings";
import InputWithSuffix from "../components/InputWithSuffix";

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
  // custom hop form state handled within HopSchedule consumer; no local UI state needed here
  const [showFlavorVisualizer, setShowFlavorVisualizer] = useState(false);
  const [otherIngredients, setOtherIngredients] = useState<OtherIngredient[]>(
    []
  );
  const [fermentationSteps, setFermentationSteps] = useState<
    FermentationStep[]
  >([
    {
      id: crypto.randomUUID(),
      stage: "primary",
      tempC: 20,
      days: 10,
    },
  ]);

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
  // removed hover-based summary details; keep ref cleanup for safety
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
  // Fermentation parameters now derived inside useRecipeCalculations

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

  // grouped hop presets now handled inside HopSchedule

  // Yeast preset grouping moved to YeastSection

  // Calculations centralized
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
  const {
    srm,
    color,
    ogAutoCalc,
    ogUsed,
    fgEstimated,
    fgUsed,
    abv,
    ibu,
    totalGrainKg,
    preBoilVolumeL,
    finalMashL,
    finalSpargeL,
    capacityExceeded,
    estimatedTotalFlavor,
    hasSecondTiming,
    hasDryHopAdditions,
  } = useRecipeCalculations({
    grains,
    batchVolumeL,
    efficiencyPct,
    hops,
    yeast,
    mashSteps,
    fermentationSteps,
    waterParams,
    brewMethod,
    ogAuto,
    actualOg,
    fgAuto,
    actualFg,
  });

  const effectiveAttenuationDecimal = useMemo(() => {
    if (!(ogUsed > 1))
      return Math.max(0.4, Math.min(0.98, yeast.attenuationPercent ?? 0.75));
    const eff = (ogUsed - fgUsed) / (ogUsed - 1);
    return Math.max(0.4, Math.min(0.98, eff));
  }, [ogUsed, fgUsed, yeast.attenuationPercent]);

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
              others: otherIngredients,
              yeast,
              mash: { steps: mashSteps },
              fermentation: { steps: fermentationSteps },
              water: {
                ...waterParams,
                mashWaterL: finalMashL,
                spargeWaterL: finalSpargeL,
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
          <InputWithSuffix
            value={batchVolumeL}
            onChange={(n) => setBatchVolumeL(n)}
            suffix=" L"
            suffixClassName="right-3 text-[10px]"
            step={0.1}
            placeholder="20.0"
          />
        </label>
        <label className="block">
          <div className="text-sm  text-white/50  mb-1">
            Brewhouse Efficiency (%)
          </div>
          <InputWithSuffix
            value={efficiencyPct}
            onChange={(n) => setEfficiencyPct(n)}
            suffix=" %"
            suffixClassName="right-3 text-[10px]"
            step={1}
            placeholder="72"
          />
        </label>
        {/* Row with Style toggle + OG + FG */}
        <StyleSelector
          bjcpStyleLabel={
            bjcpStyle ? `${bjcpStyle.code}. ${bjcpStyle.name}` : ""
          }
          bjcpStyleCode={bjcpStyleCode}
          onChangeStyleCode={setBjcpStyleCode}
          showStyleInfo={showStyleInfo}
          onToggleStyleInfo={() => setShowStyleInfo((v) => !v)}
        />
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
          <InputWithSuffix
            value={Number(
              (ogAuto ? ogAutoCalc : actualOg ?? ogAutoCalc).toFixed(3)
            )}
            onChange={(n) => !ogAuto && setActualOg(n)}
            suffix=" "
            step={0.001}
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
          <InputWithSuffix
            value={Number(
              (fgAuto ? fgEstimated : actualFg ?? fgEstimated).toFixed(3)
            )}
            onChange={(n) => !fgAuto && setActualFg(n)}
            suffix=" "
            step={0.001}
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

      <WaterSettings
        show={showWaterSettings}
        onToggle={() => setShowWaterSettings((v) => !v)}
        state={{
          mashThicknessLPerKg,
          grainAbsorptionLPerKg,
          mashTunDeadspaceL,
          mashTunCapacityL,
          boilTimeMin,
          boilOffRateLPerHour,
          coolingShrinkagePercent,
          kettleLossL,
          chillerLossL,
          brewMethod,
        }}
        onChange={(patch) => {
          if (patch.mashThicknessLPerKg != null)
            setMashThicknessLPerKg(patch.mashThicknessLPerKg);
          if (patch.grainAbsorptionLPerKg != null)
            setGrainAbsorptionLPerKg(patch.grainAbsorptionLPerKg);
          if (patch.mashTunDeadspaceL != null)
            setMashTunDeadspaceL(patch.mashTunDeadspaceL);
          if ("mashTunCapacityL" in patch)
            setMashTunCapacityL(patch.mashTunCapacityL);
          if (patch.boilTimeMin != null) setBoilTimeMin(patch.boilTimeMin);
          if (patch.boilOffRateLPerHour != null)
            setBoilOffRateLPerHour(patch.boilOffRateLPerHour);
          if (patch.coolingShrinkagePercent != null)
            setCoolingShrinkagePercent(patch.coolingShrinkagePercent);
          if (patch.kettleLossL != null) setKettleLossL(patch.kettleLossL);
          if (patch.chillerLossL != null) setChillerLossL(patch.chillerLossL);
          if (patch.brewMethod != null) setBrewMethod(patch.brewMethod);
        }}
      />

      {capacityExceeded && (
        <div className="rounded-md border border-amber-400/50 bg-amber-200/50 p-3 text-sm text-amber-900">
          Mash water exceeds mash tun capacity ({mashTunCapacityL?.toFixed(1)}{" "}
          L). Using {finalMashL.toFixed(1)} L mash and {finalSpargeL.toFixed(1)}{" "}
          L sparge.
        </div>
      )}

      <BatchSummary
        name={name}
        ogUsed={ogUsed}
        abv={abv}
        srm={srm}
        color={color}
        ibu={ibu}
        preBoilVolumeL={preBoilVolumeL}
        finalMashL={finalMashL}
        finalSpargeL={finalSpargeL}
        batchVolumeL={batchVolumeL}
      />

      <GrainBill
        grains={grains}
        totalGrainKg={totalGrainKg}
        batchVolumeL={batchVolumeL}
        efficiencyPct={efficiencyPct}
        effectiveAttenuationDecimal={effectiveAttenuationDecimal}
        currentAbvPct={abv}
        onAdd={() =>
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
        onUpdate={(index, next) =>
          setGrains((gs) => gs.map((g, i) => (i === index ? next : g)))
        }
        onRemove={(id) =>
          setGrains((gs) => gs.filter((grain) => grain.id !== id))
        }
      />

      <MashSchedule
        steps={mashSteps}
        onAdd={() =>
          setMashSteps((xs) => [
            ...xs,
            {
              id: crypto.randomUUID(),
              type: "infusion",
              tempC: 66,
              timeMin: 15,
            },
          ])
        }
        onUpdate={(index, next) =>
          setMashSteps((xs) => xs.map((s, i) => (i === index ? next : s)))
        }
        onRemove={(id) => setMashSteps((xs) => xs.filter((x) => x.id !== id))}
      />

      <HopSchedule
        hops={hops}
        batchVolumeL={batchVolumeL}
        ogUsed={ogUsed}
        hasSecondTiming={hasSecondTiming}
        onAdd={() =>
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
        onUpdate={(index, next) =>
          setHops((hs) => hs.map((h, i) => (i === index ? next : h)))
        }
        onRemove={(id) => setHops((hs) => hs.filter((hop) => hop.id !== id))}
        onAddCustomHopRequested={() => {
          /* handled within HopSchedule or future preset modal */
        }}
        showVisualizer={showFlavorVisualizer}
        onToggleVisualizer={() => setShowFlavorVisualizer((v) => !v)}
        hopFlavorSeries={hopFlavorSeries}
        estimatedTotalFlavor={estimatedTotalFlavor}
      />

      <OtherIngredients
        items={otherIngredients}
        presetByCategory={
          getOtherIngredientPresets() as Record<
            OtherIngredientCategory,
            string[]
          >
        }
        onAdd={() =>
          setOtherIngredients((xs) => [
            ...xs,
            {
              id: crypto.randomUUID(),
              name: "",
              category: "other",
              amount: 0,
              unit: "g",
              timing: "boil",
              customNameLocked: false,
              customNameSelected: false,
            },
          ])
        }
        onUpdate={(index, next) =>
          setOtherIngredients((xs) =>
            xs.map((x, i) => (i === index ? next : x))
          )
        }
        onRemove={(id) =>
          setOtherIngredients((xs) => xs.filter((x) => x.id !== id))
        }
      />

      <YeastSection
        yeast={yeast}
        onChangeYeast={setYeast}
        ogUsed={ogUsed}
        batchVolumeL={batchVolumeL}
      />

      <FermentationSection
        steps={fermentationSteps}
        onChange={setFermentationSteps}
        showDryHopColumn={hasDryHopAdditions}
      />

      <section className="section-soft space-y-3">
        <WaterSaltsSection
          mashWaterL={finalMashL}
          spargeWaterL={finalSpargeL}
        />
      </section>
    </div>
  );
}
