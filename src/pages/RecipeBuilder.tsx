import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Collapsible from "../components/Collapsible";
import {
  useRecipeStore,
  type GrainItem,
  type HopItem,
  type YeastItem,
  type FermentationStep,
  type MashStep,
  type OtherIngredient,
  type OtherIngredientCategory,
} from "../hooks/useRecipeStore";
import { type WaterParams } from "../utils/calculations";
// per-hop IBU calc handled inside HopSchedule; keep total calc in hook
import FermentationSection from "../modules/recipe/components/FermentationSection";
import { getOtherIngredientPresets } from "../utils/presets";
import type { Recipe } from "../hooks/useRecipeStore";
import { findBjcpStyleByCode } from "../utils/bjcp";
import { getBjcpStyleSpec } from "../utils/bjcpSpecs";
import WaterSaltsSection from "../components/WaterSaltsSection";
import StyleRangeBars from "../components/StyleRangeBars";
import { useRecipeCalculations } from "../hooks/useRecipeCalculations";
import GrainBill from "../modules/recipe/components/GrainBill";
import HopSchedule from "../modules/recipe/components/HopSchedule";
import MashSchedule from "../modules/recipe/components/MashSchedule";
import OtherIngredients from "../modules/recipe/components/OtherIngredients";
import StyleSelector from "../modules/recipe/components/StyleSelector";
import YeastSection from "../modules/recipe/components/YeastSection";
import BatchSummary from "../modules/recipe/components/SummaryStickyHeader";
import WaterSettings from "../modules/recipe/components/WaterSettings";
import InputWithSuffix from "../components/InputWithSuffix";
import CarbonationCalculator from "../components/CarbonationCalculator";

export default function RecipeBuilder() {
  const navigate = useNavigate();
  const upsert = useRecipeStore((s) => s.upsert);
  const removeRecipe = useRecipeStore((s) => s.remove);
  const recipes = useRecipeStore((s) => s.recipes);
  const [name, setName] = useState("New Recipe");
  const [currentRecipeId, setCurrentRecipeId] = useState<string | undefined>(
    undefined
  );
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
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement | null>(null);
  // removed hover-based summary details; keep ref cleanup for safety
  const hoverDisableTimerRef = useRef<number | null>(null);
  const [brewMethod, setBrewMethod] = useState<
    "three-vessel" | "biab-full" | "biab-sparge"
  >("three-vessel");
  const [coolingShrinkagePercent, setCoolingShrinkagePercent] = useState(4);
  const [kettleLossL, setKettleLossL] = useState(0.5);
  const [chillerLossL, setChillerLossL] = useState(0);
  // Carbonation calculator state for export
  const [carbUnit, setCarbUnit] = useState<"metric" | "us">("metric");
  const [carbVolumes, setCarbVolumes] = useState<number>(2.2);
  const [carbTempC, setCarbTempC] = useState<number>(4);
  const [carbTempF, setCarbTempF] = useState<number>(38);
  // Yeast starter export snapshot
  const [yeastStarterExport, setYeastStarterExport] = useState<{
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
  } | null>(null);
  // One-time hydration state for YeastPitchCalc when loading/resetting a recipe
  const [yeastStarterInitial, setYeastStarterInitial] = useState<{
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
  } | null>(null);
  const handleStarterChange = useCallback(
    (state: {
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
    }) => setYeastStarterExport(state),
    []
  );
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

  // Close save menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showSaveMenu) return;
      const target = e.target as Node | null;
      if (
        saveMenuRef.current &&
        target &&
        !saveMenuRef.current.contains(target)
      ) {
        setShowSaveMenu(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [showSaveMenu]);

  // Close delete menu on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showDeleteMenu) return;
      const target = e.target as Node | null;
      if (
        deleteMenuRef.current &&
        target &&
        !deleteMenuRef.current.contains(target)
      ) {
        setShowDeleteMenu(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [showDeleteMenu]);

  // Helpers: reset/new and load
  const resetToDefaults = () => {
    setCurrentRecipeId(undefined);
    setName("New Recipe");
    setBjcpStyleCode("");
    setBatchVolumeL(20);
    setEfficiencyPct(72);
    setGrains([
      {
        id: crypto.randomUUID(),
        name: "Pale Malt",
        weightKg: 4,
        colorLovibond: 2,
        potentialGu: 34.5,
        type: "grain",
      },
    ]);
    setHops([
      {
        id: crypto.randomUUID(),
        name: "",
        grams: 0,
        alphaAcidPercent: 0,
        timeMin: 60,
        type: "boil",
      },
    ]);
    setYeast({ name: "SafAle US-05", attenuationPercent: 0.78 });
    setOtherIngredients([]);
    setFermentationSteps([
      {
        id: crypto.randomUUID(),
        stage: "primary",
        tempC: 20,
        days: 10,
      },
    ]);
    setMashThicknessLPerKg(3);
    setGrainAbsorptionLPerKg(0.8);
    setMashTunDeadspaceL(0.5);
    setMashTunCapacityL(undefined);
    setBoilTimeMin(60);
    setBoilOffRateLPerHour(3);
    setCoolingShrinkagePercent(4);
    setKettleLossL(0.5);
    setChillerLossL(0);
    setBrewMethod("three-vessel");
    setMashSteps([
      {
        id: crypto.randomUUID(),
        type: "infusion",
        tempC: 66,
        timeMin: 60,
      },
    ]);
    setOgAuto(true);
    setActualOg(undefined);
    setFgAuto(true);
    setActualFg(undefined);
    setYeastStarterExport(null);
    setYeastStarterInitial(null);
  };

  const loadRecipe = (r: Recipe) => {
    setCurrentRecipeId(r.id);
    setName(r.name || "Untitled");
    setBjcpStyleCode(r.bjcpStyleCode || "");
    setBatchVolumeL(r.batchVolumeL);
    if (r.efficiencyPct != null) setEfficiencyPct(r.efficiencyPct);
    setGrains(
      (r.grains && r.grains.length ? r.grains : []).map((g) => ({ ...g }))
    );
    setHops((r.hops && r.hops.length ? r.hops : []).map((h) => ({ ...h })));
    setYeast(
      r.yeast
        ? { ...r.yeast }
        : { name: "SafAle US-05", attenuationPercent: 0.78 }
    );
    setOtherIngredients(
      (r.others && r.others.length ? r.others : []).map((x) => ({ ...x }))
    );
    const steps: MashStep[] =
      r.mash?.steps && r.mash.steps.length
        ? (r.mash.steps as MashStep[])
        : [
            {
              id: crypto.randomUUID(),
              type: "infusion",
              tempC: 66,
              timeMin: 60,
            },
          ];
    setMashSteps(steps);
    const ferm: FermentationStep[] =
      r.fermentation?.steps && r.fermentation.steps.length
        ? (r.fermentation.steps as FermentationStep[])
        : [{ id: crypto.randomUUID(), stage: "primary", tempC: 20, days: 10 }];
    setFermentationSteps(ferm);
    // Water
    setMashThicknessLPerKg(r.water?.mashThicknessLPerKg ?? 3);
    setGrainAbsorptionLPerKg(r.water?.grainAbsorptionLPerKg ?? 0.8);
    setMashTunDeadspaceL(r.water?.mashTunDeadspaceL ?? 0.5);
    setMashTunCapacityL(r.water?.mashTunCapacityL);
    setBoilTimeMin(r.water?.boilTimeMin ?? 60);
    setBoilOffRateLPerHour(r.water?.boilOffRateLPerHour ?? 3);
    setCoolingShrinkagePercent(r.water?.coolingShrinkagePercent ?? 4);
    setKettleLossL(r.water?.kettleLossL ?? 0.5);
    setChillerLossL(r.water?.chillerLossL ?? 0);
    setBrewMethod(r.brewMethod ?? "three-vessel");
    // Yeast starter snapshot (for hydration of calculator)
    setYeastStarterExport(r.yeastStarter ?? null);
    setYeastStarterInitial(r.yeastStarter ?? null);
    // OG/FG
    if (r.targetOG != null) {
      setOgAuto(false);
      setActualOg(r.targetOG);
    } else {
      setOgAuto(true);
      setActualOg(undefined);
    }
    if (r.targetFG != null) {
      setFgAuto(false);
      setActualFg(r.targetFG);
    } else {
      setFgAuto(true);
      setActualFg(undefined);
    }
  };

  const getUniqueRecipeName = (proposedRaw: string): string => {
    const proposed = (proposedRaw || "Untitled").trim();
    const existingNames = new Set(recipes.map((r) => r.name));
    if (!existingNames.has(proposed)) return proposed;
    let i = 1;
    let candidate = `${proposed} (${i})`;
    while (existingNames.has(candidate)) {
      i += 1;
      candidate = `${proposed} (${i})`;
    }
    return candidate;
  };

  // Markdown export helpers
  const sanitizeFileName = (raw: string): string => {
    const base = (raw || "Untitled").trim().replace(/[\n\r]+/g, " ");
    const sanitized = base
      .replace(/[^a-zA-Z0-9-_ .]/g, "")
      .replace(/\s+/g, " ");
    return (sanitized || "Untitled").slice(0, 120);
  };

  const formatNumber = (n: number | undefined, digits = 2): string => {
    if (n == null || Number.isNaN(n)) return "-";
    return Number(n).toFixed(digits);
  };

  const downloadTextFile = (
    filename: string,
    content: string,
    mime = "text/markdown;charset=utf-8"
  ) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Unit conversions for Markdown readability
  const litersToGallons = (l: number | undefined): number | undefined =>
    l == null ? undefined : l * 0.2641720524;
  const kgToLb = (kg: number | undefined): number | undefined =>
    kg == null ? undefined : kg * 2.2046226218;
  const gToOz = (g: number | undefined): number | undefined =>
    g == null ? undefined : g * 0.03527396195;
  const cToF = (c: number | undefined): number | undefined =>
    c == null ? undefined : (c * 9) / 5 + 32;

  // Carbonation helpers (aligned with CarbonationCalculator)
  const calculatePsiFromTempFAndVolumes = (
    tempF: number,
    volumes: number
  ): number => {
    const t = tempF;
    const v = volumes;
    const psi =
      -16.6999 -
      0.0101059 * t +
      0.00116512 * t * t +
      0.173354 * t * v +
      4.24267 * v -
      0.0684226 * v * v;
    return Math.max(0, psi);
  };

  const generateRecipeMarkdown = (): string => {
    const title = name?.trim() ? name.trim() : "Untitled";
    const lines: string[] = [];
    const styleLabel = bjcpStyle ? `${bjcpStyle.name}` : "-";

    const batchGal = litersToGallons(batchVolumeL);
    const mashGal = litersToGallons(finalMashL);
    const spargeGal = litersToGallons(finalSpargeL);
    const preBoilGal = litersToGallons(preBoilVolumeL);

    const firstMashTemp = mashSteps[0]?.tempC;
    const firstMashTempF = cToF(firstMashTemp);

    // Group hops by type for narrative
    const boilHops = hops
      .filter((h) => h.type === "boil" || h.type === "first wort")
      .sort((a, b) => (b.timeMin ?? 0) - (a.timeMin ?? 0));
    const whirlpoolHops = hops
      .filter((h) => h.type === "whirlpool")
      .sort((a, b) => (b.whirlpoolTimeMin ?? 0) - (a.whirlpoolTimeMin ?? 0));
    const dryHops = hops.filter((h) => h.type === "dry hop");
    const mashHops = hops.filter((h) => h.type === "mash");

    const othersByTiming: Record<string, typeof otherIngredients> = {
      mash: otherIngredients.filter((x) => x.timing === "mash"),
      boil: otherIngredients.filter((x) => x.timing === "boil"),
      whirlpool: otherIngredients.filter((x) => x.timing === "whirlpool"),
      secondary: otherIngredients.filter((x) => x.timing === "secondary"),
      kegging: otherIngredients.filter((x) => x.timing === "kegging"),
      bottling: otherIngredients.filter((x) => x.timing === "bottling"),
    };

    // Title and optional style subtitle
    lines.push(`# ${title}`);
    lines.push("");
    if (bjcpStyle) {
      lines.push(`_${bjcpStyle.code}. ${bjcpStyle.name}_`);
      lines.push("");
    }

    // Vital Statistics
    lines.push("## Vital Statistics");
    lines.push("");
    lines.push(`- Style: ${styleLabel}`);
    lines.push(
      `- Batch Size: ${formatNumber(batchVolumeL, 1)} L${
        batchGal != null ? ` (${formatNumber(batchGal, 1)} gal)` : ""
      }`
    );
    lines.push(`- Brewhouse Efficiency: ${formatNumber(efficiencyPct, 0)} %`);
    lines.push(`- OG: ${formatNumber(ogUsed, 3)}`);
    lines.push(`- FG: ${formatNumber(fgUsed, 3)}`);
    lines.push(`- ABV: ${formatNumber(abv, 1)} %`);
    lines.push(`- IBU: ${formatNumber(ibu, 0)}`);
    lines.push(`- SRM: ${formatNumber(srm, 1)} (${color})`);
    lines.push("");

    // Ingredients
    lines.push("## Ingredients");
    lines.push("");
    // Malts
    lines.push("### Malts");
    for (const g of grains) {
      const kg = g.weightKg;
      const lb = kgToLb(kg);
      const lov =
        g.colorLovibond != null
          ? ` (${formatNumber(g.colorLovibond, 0)}L)`
          : "";
      lines.push(
        `- ${lb != null ? `${formatNumber(lb, 2)} lb` : "-"} (${formatNumber(
          kg,
          2
        )} kg) ${g.name || "Malt"}${lov}`
      );
    }
    lines.push("");

    // Hops
    lines.push("### Hops");
    for (const h of mashHops) {
      const oz = gToOz(h.grams);
      lines.push(
        `- Mash: ${
          oz != null ? `${formatNumber(oz, 2)} oz` : "-"
        } (${formatNumber(h.grams, 0)} g) ${h.name || "Hop"}`
      );
    }
    for (const h of boilHops) {
      const oz = gToOz(h.grams);
      const label =
        h.type === "first wort"
          ? "First Wort"
          : `${formatNumber(h.timeMin, 0)} min`;
      lines.push(
        `- ${label}: ${
          oz != null ? `${formatNumber(oz, 2)} oz` : "-"
        } (${formatNumber(h.grams, 0)} g) ${h.name || "Hop"}`
      );
    }
    for (const h of whirlpoolHops) {
      const oz = gToOz(h.grams);
      const label =
        h.whirlpoolTimeMin != null && h.whirlpoolTimeMin > 0
          ? `Whirlpool ${formatNumber(h.whirlpoolTimeMin, 0)} min`
          : "Flameout";
      const temp =
        h.whirlpoolTempC != null
          ? ` @ ${formatNumber(cToF(h.whirlpoolTempC), 0)}°F (${formatNumber(
              h.whirlpoolTempC,
              0
            )}°C)`
          : "";
      lines.push(
        `- ${label}${temp}: ${
          oz != null ? `${formatNumber(oz, 2)} oz` : "-"
        } (${formatNumber(h.grams, 0)} g) ${h.name || "Hop"}`
      );
    }
    if (dryHops.length) {
      lines.push("");
      lines.push("Dry Hop:");
      for (const h of dryHops) {
        const oz = gToOz(h.grams);
        const stage = h.dryHopStage ? ` (${h.dryHopStage})` : "";
        const days =
          h.dryHopDays != null
            ? ` for ${formatNumber(h.dryHopDays, 0)} days`
            : "";
        lines.push(
          `- ${oz != null ? `${formatNumber(oz, 2)} oz` : "-"} (${formatNumber(
            h.grams,
            0
          )} g) ${h.name || "Hop"}${stage}${days}`
        );
      }
    }
    lines.push("");

    // Yeast
    lines.push("### Yeast");
    lines.push(
      `- ${yeast.name}${
        yeast.attenuationPercent != null
          ? ` (attenuation ${formatNumber(yeast.attenuationPercent * 100, 0)}%)`
          : ""
      }`
    );
    if (yeastStarterExport) {
      const ys = yeastStarterExport;
      const pkg = (() => {
        if (ys.yeastType === "dry")
          return `${Math.max(0, Math.floor(ys.packs))} pack${
            Math.max(0, Math.floor(ys.packs)) === 1 ? "" : "s"
          } of Dry (11g)`;
        if (ys.yeastType === "slurry")
          return `Slurry ${formatNumber(ys.slurryLiters, 1)} L @ ${formatNumber(
            ys.slurryBillionPerMl,
            1
          )} B/mL`;
        const label =
          ys.yeastType === "liquid-200" ? "Liquid (200B)" : "Liquid (100B)";
        const packsText = `${Math.max(0, Math.floor(ys.packs))} pack${
          Math.max(0, Math.floor(ys.packs)) === 1 ? "" : "s"
        } of ${label}`;
        const mfg = ys.mfgDate ? ` (Mfg ${ys.mfgDate})` : "";
        return `${packsText}${mfg}`;
      })();
      const step = ys.steps.length ? ys.steps[ys.steps.length - 1] : undefined;
      const starterPart = step
        ? ` in a ${formatNumber(step.liters, 1)}L Starter @ ${formatNumber(
            step.gravity,
            3
          )}`
        : "";
      const finalCellsPart =
        ys.finalEndB != null
          ? ` (Final cells: ${formatNumber(ys.finalEndB, 0)} B)`
          : "";
      lines.push(`- ${pkg}${starterPart}${finalCellsPart}`);
    }
    // Yeast Starter (if available)
    if (yeastStarterExport) {
      lines.push("#### Yeast Starter");
      const ys = yeastStarterExport;
      const pkg = (() => {
        if (ys.yeastType === "dry")
          return `${Math.max(0, Math.floor(ys.packs))} × 11 g dry`;
        if (ys.yeastType === "slurry")
          return `Slurry ${formatNumber(ys.slurryLiters, 1)} L @ ${formatNumber(
            ys.slurryBillionPerMl,
            1
          )} B/mL`;
        const label =
          ys.yeastType === "liquid-200" ? "Liquid (200B)" : "Liquid (100B)";
        const mfg = ys.mfgDate ? `, Mfg ${ys.mfgDate}` : "";
        return `${Math.max(0, Math.floor(ys.packs))} pack(s) ${label}${mfg}`;
      })();
      lines.push(`- Package: ${pkg}`);
      lines.push(`- Required Cells: ${formatNumber(ys.requiredCellsB, 0)} B`);
      lines.push(`- Available Cells: ${formatNumber(ys.cellsAvailableB, 0)} B`);
      if (ys.steps.length > 0) {
        lines.push("- Starter Plan:");
        ys.steps.forEach((s, i) => {
          const model =
            s.model.kind === "white"
              ? `White (${s.model.aeration})`
              : "Braukaiser";
          lines.push(
            `  ${i + 1}. ${formatNumber(s.liters, 1)} L @ ${formatNumber(
              s.gravity,
              3
            )} (Model: ${model}) → DME ${formatNumber(s.dmeGrams, 0)} g`
          );
        });
        lines.push(
          `- Starter Total: ${formatNumber(
            ys.totalStarterL,
            1
          )} L, DME ${formatNumber(ys.totalDmeG, 0)} g`
        );
        lines.push(`- Estimated End Cells: ${formatNumber(ys.finalEndB, 0)} B`);
      }
      lines.push("");
    }

    // Brewing Process
    lines.push("## Brewing Process");
    lines.push("");

    // Mash
    lines.push("### Mash");
    lines.push("");
    if (preBoilVolumeL != null || finalSpargeL != null) {
      const lhs =
        preBoilVolumeL != null
          ? `${formatNumber(preBoilVolumeL, 1)} L${
              preBoilGal != null ? ` (${formatNumber(preBoilGal, 1)} gal)` : ""
            }`
          : "-";
      const rhs =
        finalSpargeL != null
          ? `${formatNumber(finalSpargeL, 1)} L${
              spargeGal != null ? ` (${formatNumber(spargeGal, 1)} gal)` : ""
            }`
          : "-";
      lines.push(`${lhs} in boil -> ${rhs} sparge.`);
      lines.push("");
    }
    const mashWaterText =
      finalMashL != null
        ? `${formatNumber(finalMashL, 1)} L${
            mashGal != null ? ` (${formatNumber(mashGal, 1)} gal)` : ""
          }`
        : "-";
    lines.push(
      `1. Heat strike water to achieve mash temperature of ${
        firstMashTempF != null ? `${formatNumber(firstMashTempF, 0)}°F` : "-"
      }${firstMashTemp != null ? ` (${formatNumber(firstMashTemp, 0)}°C)` : ""}`
    );
    lines.push(`2. Dough-in with ${mashWaterText}`);
    mashSteps.forEach((s, idx) => {
      const tempF = cToF(s.tempC);
      lines.push(
        `${idx + 3}. Hold at ${
          tempF != null ? `${formatNumber(tempF, 0)}°F` : "-"
        } (${formatNumber(s.tempC, 0)}°C) for ${formatNumber(
          s.timeMin,
          0
        )} minutes${
          s.decoctionPercent != null
            ? ` (decoction ${formatNumber(s.decoctionPercent, 0)}%)`
            : ""
        }`
      );
    });
    const afterMashIdx = mashSteps.length + 3;
    lines.push(`${afterMashIdx}. Mash out and vorlauf as needed`);
    lines.push(
      `${afterMashIdx + 1}. Sparge with ${
        finalSpargeL != null ? `${formatNumber(finalSpargeL, 1)} L` : "-"
      }${spargeGal != null ? ` (${formatNumber(spargeGal, 1)} gal)` : ""}`
    );
    if (othersByTiming.mash.length || mashHops.length) {
      lines.push(`${afterMashIdx + 2}. During mash, add:`);
      for (const x of othersByTiming.mash) {
        lines.push(`   - ${x.name} — ${formatNumber(x.amount, 2)} ${x.unit}`);
      }
      for (const h of mashHops) {
        lines.push(
          `   - ${h.name} — ${formatNumber(h.grams, 0)} g (${formatNumber(
            gToOz(h.grams),
            2
          )} oz)`
        );
      }
    }
    lines.push("");

    // Boil
    lines.push(`### Boil (${formatNumber(boilTimeMin, 0)} minutes)`);
    lines.push("");
    lines.push("1. Start timer when boil begins");
    let boilStepIndex = 2;
    for (const h of boilHops) {
      const label =
        h.type === "first wort"
          ? "Before boil (first wort)"
          : `With ${formatNumber(h.timeMin, 0)} min remaining`;
      lines.push(
        `${boilStepIndex}. ${label}: add ${formatNumber(
          h.grams,
          0
        )} g (${formatNumber(gToOz(h.grams), 2)} oz) ${h.name}`
      );
      boilStepIndex += 1;
    }
    for (const x of othersByTiming.boil) {
      lines.push(
        `${boilStepIndex}. During boil: add ${x.name} — ${formatNumber(
          x.amount,
          2
        )} ${x.unit}`
      );
      boilStepIndex += 1;
    }
    for (const h of whirlpoolHops) {
      const when =
        h.whirlpoolTimeMin != null && h.whirlpoolTimeMin > 0
          ? `Whirlpool ${formatNumber(h.whirlpoolTimeMin, 0)} min`
          : "Flameout";
      const temp =
        h.whirlpoolTempC != null
          ? ` @ ${formatNumber(cToF(h.whirlpoolTempC), 0)}°F (${formatNumber(
              h.whirlpoolTempC,
              0
            )}°C)`
          : "";
      lines.push(
        `${boilStepIndex}. ${when}${temp}: add ${formatNumber(
          h.grams,
          0
        )} g (${formatNumber(gToOz(h.grams), 2)} oz) ${h.name}`
      );
      boilStepIndex += 1;
    }
    for (const x of othersByTiming.whirlpool) {
      lines.push(
        `${boilStepIndex}. During whirlpool: add ${x.name} — ${formatNumber(
          x.amount,
          2
        )} ${x.unit}`
      );
      boilStepIndex += 1;
    }
    lines.push("");

    // Fermentation
    lines.push("### Fermentation");
    lines.push("");
    const pitchTempC = fermentationSteps[0]?.tempC ?? 20;
    const pitchTempF = cToF(pitchTempC);
    lines.push(
      `1. Cool wort to ${formatNumber(pitchTempF ?? 68, 0)}°F (${formatNumber(
        pitchTempC,
        0
      )}°C)`
    );
    lines.push(`2. Pitch ${yeast.name}`);
    let fermIndex = 3;
    fermentationSteps.forEach((s) => {
      const tf = cToF(s.tempC);
      lines.push(
        `${fermIndex}. Ferment at ${formatNumber(tf, 0)}°F (${formatNumber(
          s.tempC,
          0
        )}°C) in ${s.stage} for ${formatNumber(s.days, 0)} days${
          s.pressurePsi != null
            ? ` (pressure ${formatNumber(s.pressurePsi, 1)} psi)`
            : ""
        }`
      );
      fermIndex += 1;
      if (
        s.stage === "primary" ||
        s.stage === "secondary" ||
        s.stage === "conditioning"
      ) {
        if (s.dryHopReminder) {
          lines.push(`   - Dry hop as listed below at start of this stage`);
        }
      }
    });
    for (const x of othersByTiming.secondary) {
      lines.push(
        `   - During secondary: add ${x.name} — ${formatNumber(x.amount, 2)} ${
          x.unit
        }`
      );
    }
    for (const h of dryHops) {
      const stage = h.dryHopStage ? h.dryHopStage : "post-fermentation";
      const days =
        h.dryHopDays != null
          ? ` for ${formatNumber(h.dryHopDays, 0)} days`
          : "";
      lines.push(
        `   - Dry hop (${stage}): ${formatNumber(h.grams, 0)} g (${formatNumber(
          gToOz(h.grams),
          2
        )} oz) ${h.name}${days}`
      );
    }
    for (const x of othersByTiming.kegging) {
      lines.push(
        `   - At kegging: add ${x.name} — ${formatNumber(x.amount, 2)} ${
          x.unit
        }`
      );
    }
    for (const x of othersByTiming.bottling) {
      lines.push(
        `   - At bottling: add ${x.name} — ${formatNumber(x.amount, 2)} ${
          x.unit
        }`
      );
    }
    lines.push("");

    // Carbonation
    lines.push("## Carbonation");
    lines.push("");
    const tempFUsed =
      carbUnit === "metric" ? cToF(carbTempC) ?? carbTempF : carbTempF;
    const psi =
      tempFUsed != null
        ? calculatePsiFromTempFAndVolumes(tempFUsed, carbVolumes)
        : undefined;
    const bar = psi != null ? psi * 0.0689475729 : undefined;
    lines.push(`- Target CO₂: ${formatNumber(carbVolumes, 1)} vols`);
    lines.push(
      `- Beer Temp: ${formatNumber(carbTempF, 0)}°F (${formatNumber(
        carbTempC,
        1
      )}°C)`
    );
    if (psi != null && bar != null) {
      lines.push(
        `- Regulator Setting: ${formatNumber(psi, 1)} psi (${formatNumber(
          bar,
          2
        )} bar)`
      );
    }
    const styleSpec = bjcpStyle?.code
      ? getBjcpStyleSpec(bjcpStyle.code)
      : undefined;
    if (styleSpec?.co2 && styleSpec.co2.length === 2) {
      lines.push(
        `- Style Recommendation: ${formatNumber(
          styleSpec.co2[0],
          1
        )}–${formatNumber(styleSpec.co2[1], 1)} vols` +
          (bjcpStyle
            ? ` (${bjcpStyle.name}${
                bjcpStyle.code ? `, ${bjcpStyle.code}` : ""
              })`
            : "")
      );
    }
    lines.push("");

    // Footer
    lines.push(`_Exported: ${new Date().toISOString()}_`);

    return lines.join("\n");
  };

  return (
    <div className="page-recipe max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Recipe Builder
          </h1>
          <p className="mt-1 text-muted text-sm">
            Inline stats update as you type.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border px-2 py-2 bg-black/20"
              value={currentRecipeId || ""}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                if (id === "__new__") {
                  resetToDefaults();
                  return;
                }
                const r = recipes.find((x) => x.id === id);
                if (r) loadRecipe(r);
              }}
            >
              <option value="">Load…</option>
              <option value="__new__">New</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative" ref={saveMenuRef}>
            <button
              className="btn-neon"
              onClick={() => {
                if (currentRecipeId) {
                  setShowSaveMenu((v) => !v);
                } else {
                  // Save brand new
                  const id = crypto.randomUUID();
                  const recipe: Recipe = {
                    id,
                    name: getUniqueRecipeName(name),
                    createdAt: new Date().toISOString(),
                    bjcpStyleCode: bjcpStyleCode || undefined,
                    batchVolumeL,
                    efficiencyPct,
                    targetOG: ogAuto ? undefined : actualOg ?? ogUsed,
                    targetFG: fgAuto ? undefined : actualFg ?? fgUsed,
                    grains,
                    hops,
                    others: otherIngredients,
                    yeast,
                    yeastStarter: yeastStarterExport || undefined,
                    mash: { steps: mashSteps },
                    fermentation: { steps: fermentationSteps },
                    water: {
                      ...waterParams,
                      mashWaterL: finalMashL,
                      spargeWaterL: finalSpargeL,
                      preBoilVolumeL,
                    },
                    brewMethod,
                  };
                  upsert(recipe);
                  setCurrentRecipeId(id);
                }
              }}
            >
              {currentRecipeId ? "Save" : "Save Recipe"}
            </button>
            {showSaveMenu && currentRecipeId && (
              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-md border border-white/10 bg-black/70 backdrop-blur shadow-lg">
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-white/10 rounded-t-md"
                  onClick={() => {
                    const id = currentRecipeId;
                    const existing = recipes.find((x) => x.id === id);
                    const recipe: Recipe = {
                      id,
                      name,
                      createdAt:
                        existing?.createdAt ?? new Date().toISOString(),
                      bjcpStyleCode: bjcpStyleCode || undefined,
                      batchVolumeL,
                      efficiencyPct,
                      targetOG: ogAuto ? undefined : actualOg ?? ogUsed,
                      targetFG: fgAuto ? undefined : actualFg ?? fgUsed,
                      grains,
                      hops,
                      others: otherIngredients,
                      yeast,
                      yeastStarter: yeastStarterExport || undefined,
                      carbonation: {
                        unit: carbUnit,
                        volumes: carbVolumes,
                        tempC: carbTempC,
                        tempF: carbTempF,
                      },
                      mash: { steps: mashSteps },
                      fermentation: { steps: fermentationSteps },
                      water: {
                        ...waterParams,
                        mashWaterL: finalMashL,
                        spargeWaterL: finalSpargeL,
                        preBoilVolumeL,
                      },
                      brewMethod,
                    };
                    upsert(recipe);
                    setShowSaveMenu(false);
                  }}
                >
                  Save Changes
                </button>
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-white/10"
                  onClick={() => {
                    const id = crypto.randomUUID();
                    const recipe: Recipe = {
                      id,
                      name: getUniqueRecipeName(name),
                      createdAt: new Date().toISOString(),
                      bjcpStyleCode: bjcpStyleCode || undefined,
                      batchVolumeL,
                      efficiencyPct,
                      targetOG: ogAuto ? undefined : actualOg ?? ogUsed,
                      targetFG: fgAuto ? undefined : actualFg ?? fgUsed,
                      grains,
                      hops,
                      others: otherIngredients,
                      yeast,
                      yeastStarter: yeastStarterExport || undefined,
                      carbonation: {
                        unit: carbUnit,
                        volumes: carbVolumes,
                        tempC: carbTempC,
                        tempF: carbTempF,
                      },
                      mash: { steps: mashSteps },
                      fermentation: { steps: fermentationSteps },
                      water: {
                        ...waterParams,
                        mashWaterL: finalMashL,
                        spargeWaterL: finalSpargeL,
                        preBoilVolumeL,
                      },
                      brewMethod,
                    };
                    upsert(recipe);
                    setCurrentRecipeId(id);
                    setShowSaveMenu(false);
                  }}
                >
                  Save as New
                </button>
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-white/10 rounded-b-md"
                  onClick={() => {
                    const md = generateRecipeMarkdown();
                    const filename = `${sanitizeFileName(name)}.md`;
                    downloadTextFile(filename, md);
                    setShowSaveMenu(false);
                  }}
                >
                  Save to Markdown
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={deleteMenuRef}>
            <button
              className={`btn-subtle ${
                !currentRecipeId
                  ? "opacity-50 cursor-not-allowed"
                  : "text-white hover:text-orange-400 transition-colors"
              }`}
              disabled={!currentRecipeId}
              onClick={() => {
                if (!currentRecipeId) return;
                setShowDeleteMenu((v) => !v);
              }}
            >
              <span className="sr-only">Delete</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="w-5 h-5"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m1 0-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m3 4v6m4-6v6"
                />
              </svg>
            </button>
            {showDeleteMenu && currentRecipeId && (
              <div className="absolute right-0 top-full mt-1 z-20 w-60 rounded-md border border-white/10 bg-black/70 backdrop-blur shadow-lg">
                <div className="px-3 py-2 text-sm text-white/80">
                  Are you sure you want to delete this recipe?
                </div>
                <div className="flex">
                  <button
                    className="flex-1 text-left px-3 py-2 hover:bg-white/10 text-red-400 rounded-bl-md"
                    onClick={() => {
                      const id = currentRecipeId;
                      removeRecipe(id);
                      setShowDeleteMenu(false);
                      setShowSaveMenu(false);
                      resetToDefaults();
                    }}
                  >
                    Confirm Delete
                  </button>
                  <button
                    className="flex-1 text-left px-3 py-2 hover:bg-white/10 rounded-br-md"
                    onClick={() => setShowDeleteMenu(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <button
              className={`btn-neon ${!name ? "opacity-50" : ""}`}
              onClick={() => {
                // Always save latest state, create ID if needed, then navigate
                const id = currentRecipeId ?? crypto.randomUUID();
                const existing = currentRecipeId
                  ? recipes.find((x) => x.id === currentRecipeId)
                  : undefined;
                const recipe: Recipe = {
                  id,
                  name: currentRecipeId ? name : getUniqueRecipeName(name),
                  createdAt: existing?.createdAt ?? new Date().toISOString(),
                  bjcpStyleCode: bjcpStyleCode || undefined,
                  batchVolumeL,
                  efficiencyPct,
                  targetOG: ogAuto ? undefined : actualOg ?? ogUsed,
                  targetFG: fgAuto ? undefined : actualFg ?? fgUsed,
                  grains,
                  hops,
                  others: otherIngredients,
                  yeast,
                  yeastStarter: yeastStarterExport || undefined,
                  carbonation: {
                    unit: carbUnit,
                    volumes: carbVolumes,
                    tempC: carbTempC,
                    tempF: carbTempF,
                  },
                  mash: { steps: mashSteps },
                  fermentation: { steps: fermentationSteps },
                  water: {
                    ...waterParams,
                    mashWaterL: finalMashL,
                    spargeWaterL: finalSpargeL,
                    preBoilVolumeL,
                  },
                  brewMethod,
                };
                upsert(recipe);
                if (!currentRecipeId) setCurrentRecipeId(id);
                navigate(`/brew/${id}`);
              }}
            >
              Brew
            </button>
          </div>
        </div>
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
              customNameLocked: false,
              customNameSelected: false,
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
        onReorder={(next) => setMashSteps(next)}
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
              customNameLocked: false,
              customNameSelected: false,
            },
          ])
        }
        onUpdate={(index, next) =>
          setHops((hs) => hs.map((h, i) => (i === index ? next : h)))
        }
        onRemove={(id) => setHops((hs) => hs.filter((hop) => hop.id !== id))}
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

      <section className="section-soft space-y-3">
        <YeastSection
          yeast={yeast}
          onChangeYeast={setYeast}
          ogUsed={ogUsed}
          batchVolumeL={batchVolumeL}
          onStarterChange={handleStarterChange}
          starterInitial={yeastStarterInitial}
        />
      </section>

      <FermentationSection
        steps={fermentationSteps}
        onChange={setFermentationSteps}
        showDryHopColumn={hasDryHopAdditions}
      />

      <CarbonationCalculator
        styleName={bjcpStyle?.name}
        styleCode={bjcpStyle?.code}
        onClickStyleLink={() => setShowStyleInfo((v) => !v)}
        unit={carbUnit}
        volumes={carbVolumes}
        tempMetricC={carbTempC}
        tempUsF={carbTempF}
        onChange={({ unit, volumes, tempMetricC, tempUsF }) => {
          setCarbUnit(unit);
          setCarbVolumes(volumes);
          setCarbTempC(tempMetricC);
          setCarbTempF(tempUsF);
        }}
      />

      <section className="section-soft space-y-3">
        <WaterSaltsSection
          mashWaterL={finalMashL}
          spargeWaterL={finalSpargeL}
        />
      </section>
      <footer className="mt-12 text-center text-white/50 text-sm">
        <p> Make good things. {new Date().getFullYear()} Cheers 🍺</p>
      </footer>
    </div>
  );
}
