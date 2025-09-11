import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecipeStore } from "../hooks/useRecipeStore";
import type { Recipe, HopAddition } from "../types/recipe";
import {
  computeMashWaterL,
  computePreBoilVolumeL,
  computeSpargeFromMashUsedL,
  computeSpargeWaterL,
} from "../utils/calculations";
import { getBjcpStyleSpec } from "../utils/bjcpSpecs";
import { loadJson, saveJson } from "../utils/storage";

type BrewPhase =
  | "prep"
  | "mash"
  | "boil"
  | "whirlpool"
  | "fermentation"
  | "package";

type BrewStep = {
  id: string;
  phase: BrewPhase;
  label: string;
  details?: string;
  detailsList?: string[];
  durationSec?: number; // if undefined or 0, no timer
};

function seconds(n: number | undefined): number | undefined {
  if (n == null) return undefined;
  if (Number.isNaN(n)) return undefined;
  return Math.max(0, Math.round(n * 60));
}

function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatLiters(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "-";
  return (Math.round(n * 100) / 100).toFixed(2);
}

const TIMER_KEY = "timerStartTime";
const makeTimerKey = (recipeId?: string | null) =>
  recipeId ? `beerapp.timer.${recipeId}` : TIMER_KEY;
type PersistedTimer = { stepId: string; startMs: number } | null;

function calculatePsiFromTempFAndVolumes(
  tempF: number,
  volumes: number
): number {
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
}

function buildBoilTimeline(
  totalBoilMin: number,
  boilHops: HopAddition[],
  otherBoilAdds: { name: string; amount: string }[]
): BrewStep[] {
  const steps: BrewStep[] = [];
  const firstWort = boilHops.filter((h) => h.usage.timing === "first-wort");
  const timed = boilHops
    .filter((h) => h.usage.timing === "boil")
    .map((h) => ({ hop: h, t: Math.max(0, Math.round(h.usage.timeMin ?? 0)) }))
    .sort((a, b) => b.t - a.t);

  // First wort additions before boil
  for (const fw of firstWort) {
    steps.push({
      id: `boil-fw-${fw.id}`,
      phase: "boil",
      label: `First wort: add ${fw.ingredientRef.id || "Hop"}`,
      details:
        `${Math.round(fw.amountG)} g` +
        (fw.overrides?.alphaAcidPct
          ? ` • ${fw.overrides.alphaAcidPct}% AA`
          : ""),
    });
  }

  // Optional: list other "boil" ingredients as non-timed steps early
  for (const x of otherBoilAdds) {
    steps.push({
      id: `boil-add-${x.name}`,
      phase: "boil",
      label: `Add during boil: ${x.name}`,
      details: x.amount,
    });
  }

  // New model: each hop step carries its timer segment until the NEXT hop
  // For the first hop, the segment is (totalBoilMin - firstHop.t)
  if (timed.length === 0) {
    if (totalBoilMin > 0) {
      steps.push({
        id: `boil-only`,
        phase: "boil",
        label: `Boil (${Math.round(totalBoilMin)} min)`,
        durationSec: seconds(totalBoilMin),
      });
    }
  } else {
    for (let i = 0; i < timed.length; i++) {
      const { hop, t } = timed[i];
      const nextT = i < timed.length - 1 ? timed[i + 1].t : 0;
      // The user expectation: "Add X for t minutes" and timer runs until next addition
      const durationToNext = Math.max(0, t - nextT);
      steps.push({
        id: `boil-hop-${hop.id}`,
        phase: "boil",
        label:
          `Add ${hop.ingredientRef.id || "Hop"} for ${Math.max(
            0,
            Math.round(hop.usage.timeMin ?? 0)
          )} min` +
          (hop.overrides?.alphaAcidPct
            ? ` • ${hop.overrides.alphaAcidPct}% AA`
            : ""),
        details: `${Math.round(hop.amountG)} g`,
        durationSec: seconds(durationToNext),
      });
    }
  }

  return steps;
}

function buildBrewSteps(
  recipe: Recipe,
  ctx?: {
    mashL?: number;
    spargeL?: number;
    preBoilL?: number;
    pitchTempC?: number;
  }
): BrewStep[] {
  const steps: BrewStep[] = [];

  // Prep and Mash
  const firstMashTemp = recipe.process.mash?.steps?.[0]?.targetTempC;
  if (firstMashTemp != null) {
    steps.push({
      id: `prep-strike`,
      phase: "prep",
      label: (() => {
        const mashPart =
          ctx?.mashL != null
            ? `Heat ${formatLiters(ctx.mashL)} L mash water to ${Math.round(
                firstMashTemp
              )}°C`
            : `Heat strike water to ${Math.round(firstMashTemp)}°C`;
        const defaultSpargeTempC = 76;
        const spargePart =
          ctx?.spargeL != null
            ? `; heat ${formatLiters(
                ctx.spargeL
              )} L sparge water to ${defaultSpargeTempC}°C`
            : "";
        return `${mashPart}${spargePart}`;
      })(),
    });
  }
  // Dough-in with grain bill summary
  const grainLines: string[] = [];
  for (const g of recipe.ingredients.fermentables || []) {
    if (!g.ingredientRef?.id && !g.amountKg) continue;
    grainLines.push(
      `${(g.amountKg ?? 0).toFixed(2)} kg ${g.ingredientRef?.id || "Malt"}`
    );
  }
  steps.push({
    id: `mash-dough`,
    phase: "mash",
    label:
      ctx?.mashL != null
        ? `Dough-in with ${formatLiters(ctx.mashL)} L`
        : "Dough-in",
    detailsList: grainLines.length ? grainLines : undefined,
  });
  for (const s of recipe.process.mash?.steps || []) {
    const label =
      s.type === "decoction"
        ? `Decoction rest at ${Math.round(s.targetTempC)}°C`
        : `Rest at ${Math.round(s.targetTempC)}°C`;
    const details = undefined;
    steps.push({
      id: `mash-${s.id}`,
      phase: "mash",
      label,
      details,
      durationSec: seconds(s.timeMin),
    });
  }
  steps.push({ id: `mash-out`, phase: "mash", label: "Mash out and vorlauf" });
  steps.push({
    id: `sparge`,
    phase: "mash",
    label: "Sparge",
    details:
      ctx?.spargeL != null
        ? ctx?.preBoilL != null
          ? `Sparge with ${formatLiters(
              ctx.spargeL
            )} L to reach pre-boil volume of ${formatLiters(ctx.preBoilL)} L`
          : `Sparge with ${formatLiters(ctx.spargeL)} L`
        : undefined,
  });

  // Boil
  const boilTimeMin = recipe.equipment.snapshot.timing.boilTimeMin ?? 60;
  const boilHops = (recipe.ingredients.hops || []).filter(
    (h) => h.usage.timing === "boil" || h.usage.timing === "first-wort"
  );
  const othersBoil = (recipe.ingredients.other || [])
    .filter((x) => x.timing === "boil")
    .map((x) => ({
      name: x.ingredientRef?.id || x.notes || "Addition",
      amount: `${x.amount ?? ""} ${x.unit ?? ""}`.trim(),
    }));
  steps.push(...buildBoilTimeline(boilTimeMin, boilHops, othersBoil));

  // Whirlpool
  const whirlpoolHops = (recipe.ingredients.hops || []).filter(
    (h) => h.usage.timing === "whirlpool"
  );
  for (const w of whirlpoolHops) {
    const temp =
      w.usage.temperature != null
        ? ` @ ${Math.round(w.usage.temperature)}°C`
        : "";
    const t = w.usage.timeMin ?? 0;
    steps.push({
      id: `wp-${w.id}`,
      phase: "whirlpool",
      label: t > 0 ? `Whirlpool ${t} min${temp}` : `Flameout${temp}`,
      details: `Add ${w.ingredientRef.id || "Hop"} — ${Math.round(
        w.amountG
      )} g`,
      durationSec: t > 0 ? seconds(t) : undefined,
    });
  }

  // Chill and transfer
  const pitchTempC =
    ctx?.pitchTempC ?? recipe.process.fermentation?.steps?.[0]?.temperatureC;
  const pitchTempF =
    pitchTempC != null ? Math.round((pitchTempC * 9) / 5 + 32) : undefined;
  steps.push({
    id: `chill`,
    phase: "whirlpool",
    label:
      pitchTempC != null
        ? `Chill to pitching temp (${Math.round(pitchTempC)}°C${
            pitchTempF != null ? ` / ${pitchTempF}°F` : ""
          })`
        : "Chill to pitching temp",
  });
  steps.push({
    id: `transfer`,
    phase: "whirlpool",
    label: "Transfer to fermenter",
  });

  // Fermentation (info-only)
  steps.push({
    id: `pitch`,
    phase: "fermentation",
    label: `Pitch yeast${recipe.ingredients.yeast ? "" : ""}`,
  });
  for (const s of recipe.process.fermentation?.steps || []) {
    const days = Math.max(0, s.durationDays || 0);
    const psi =
      s.pressureKpa != null ? s.pressureKpa * 0.1450377377 : undefined;
    const pressureDetail = psi != null ? ` • ${psi.toFixed(1)} psi` : "";
    const details = `${days} days @ ${Math.round(
      s.temperatureC
    )}°C${pressureDetail}`;
    steps.push({
      id: `ferm-${s.id}`,
      phase: "fermentation",
      label: `${s.stage} fermentation`,
      details,
    });
  }

  // Package (use recipe carbonation data if available, else fallback to BJCP avg)
  const co2Vols = (() => {
    const pack = recipe.process.packaging;
    if (pack?.carbonation?.co2Volumes != null)
      return pack.carbonation.co2Volumes;
    const spec = getBjcpStyleSpec(recipe.bjcpStyleCode);
    if (spec?.co2 && spec.co2.length === 2)
      return (spec.co2[0] + spec.co2[1]) / 2;
    return 2.4;
  })();
  const serveTempC = (() => {
    const pack = recipe.process.packaging;
    if (pack?.servingTempC != null) return pack.servingTempC;
    return 3; // default fridge temp C
  })();
  const serveTempF = Math.round((serveTempC * 9) / 5 + 32);
  const psi = calculatePsiFromTempFAndVolumes(serveTempF, co2Vols);
  steps.push({
    id: `package`,
    phase: "package",
    label: "Package (keg/bottle)",
    detailsList: [
      `Set regulator: ${psi.toFixed(
        1
      )} psi @ ${serveTempF}°F (${serveTempC}°C)`,
      `Target CO₂: ${co2Vols.toFixed(1)} vols`,
    ],
  });

  return steps;
}

export default function BrewMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipes = useRecipeStore((s) => s.recipes);
  const recipe = useMemo(() => recipes.find((r) => r.id === id), [recipes, id]);

  // Compute water volumes based on equipment snapshot and grain bill
  const { finalMashL, finalSpargeL, preBoilVolumeL } = useMemo(() => {
    if (!recipe) return { finalMashL: 0, finalSpargeL: 0, preBoilVolumeL: 0 };
    const eq = recipe.equipment.snapshot;
    const targetBatchL = recipe.targetProfile.batchVolumeL ?? 20;
    const totalGrainKg = (recipe.ingredients.fermentables || []).reduce(
      (sum, f) => sum + Math.max(0, f.amountKg || 0),
      0
    );
    const totalKettleHopKg = (recipe.ingredients.hops || [])
      .filter((h) =>
        ["boil", "first-wort", "whirlpool"].includes(h.usage.timing)
      )
      .reduce((sum, h) => sum + Math.max(0, h.amountG || 0) / 1000, 0);
    const hopCoeff = Math.max(0, eq.losses.hopsAbsorptionLPerKg ?? 0.7);
    const dynamicKettleLossL =
      Math.max(0, eq.losses.kettleDeadspaceL) + hopCoeff * totalKettleHopKg;
    const waterParams = {
      mashThicknessLPerKg: eq.thermal.mashThicknessLPerKg,
      grainAbsorptionLPerKg: eq.losses.grainAbsorptionLPerKg,
      mashTunDeadspaceL: eq.volumes.lauterDeadspaceL ?? 0,
      mashTunCapacityL: eq.volumes.mashTunVolumeL,
      boilTimeMin: eq.timing.boilTimeMin,
      boilOffRateLPerHour: eq.losses.evaporationRateLPerHour,
      coolingShrinkagePercent: eq.losses.coolingShrinkagePct,
      kettleLossL: dynamicKettleLossL,
      chillerLossL: eq.losses.miscLossL,
    } as const;
    const preBoil = computePreBoilVolumeL(targetBatchL, waterParams);
    const mashWater = computeMashWaterL(totalGrainKg, {
      mashThicknessLPerKg: waterParams.mashThicknessLPerKg,
      mashTunDeadspaceL: waterParams.mashTunDeadspaceL,
    });
    const sparge = computeSpargeWaterL(totalGrainKg, targetBatchL, waterParams);

    let finalMash = mashWater;
    let finalSparge = sparge;
    const capacity = waterParams.mashTunCapacityL;
    const brewMethod = recipe.processSettings.brewMethod;
    if (brewMethod === "biab-full") {
      finalMash =
        preBoil +
        Math.max(0, waterParams.grainAbsorptionLPerKg) * totalGrainKg +
        Math.max(0, waterParams.mashTunDeadspaceL);
      finalSparge = 0;
      if (capacity && finalMash > capacity) {
        finalMash = capacity;
        finalSparge = computeSpargeFromMashUsedL(
          totalGrainKg,
          targetBatchL,
          waterParams,
          finalMash
        );
      }
    } else {
      if (capacity && mashWater > capacity) {
        finalMash = capacity;
        finalSparge = computeSpargeFromMashUsedL(
          totalGrainKg,
          targetBatchL,
          waterParams,
          finalMash
        );
      }
    }
    return {
      finalMashL: finalMash,
      finalSpargeL: finalSparge,
      preBoilVolumeL: preBoil,
    };
  }, [recipe]);

  const allSteps = useMemo(
    () =>
      recipe
        ? buildBrewSteps(recipe, {
            mashL: finalMashL,
            spargeL: finalSpargeL,
            preBoilL: preBoilVolumeL,
            pitchTempC: recipe.process.fermentation?.steps?.[0]?.temperatureC,
          })
        : [],
    [recipe, finalMashL, finalSpargeL, preBoilVolumeL]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState<number>(
    () => allSteps[0]?.durationSec ?? 0
  );
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startMsRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset timer when step changes (not when steps array recalculates)
    const dur = allSteps[currentIndex]?.durationSec ?? 0;
    setRemaining(dur);
    setRunning(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startMsRef.current = null;
  }, [currentIndex, allSteps]);

  useEffect(() => {
    if (!running) return;
    const step = allSteps[currentIndex];
    const duration = step?.durationSec ?? 0;
    if (!duration) return;
    // Drive remaining based on wall clock and persisted start time
    const updateFromWallClock = () => {
      const persisted = loadJson<PersistedTimer>(
        makeTimerKey(recipe?.id),
        null
      );
      const startMs =
        startMsRef.current ??
        (persisted && persisted.stepId === step.id ? persisted.startMs : null);
      if (startMs == null) return;
      const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const nextRemaining = Math.max(0, duration - elapsedSec);
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) {
        // Auto stop at 0
        setRunning(false);
        saveJson<PersistedTimer>(makeTimerKey(recipe?.id), null);
        startMsRef.current = null;
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };
    updateFromWallClock();
    timerRef.current = window.setInterval(updateFromWallClock, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running, allSteps, currentIndex, recipe?.id]);

  // Ensure accurate time after tab visibility changes or window focus (post-sleep)
  useEffect(() => {
    if (!running) return;
    const handler = () => {
      const step = allSteps[currentIndex];
      const duration = step?.durationSec ?? 0;
      if (!duration) return;
      const persisted = loadJson<PersistedTimer>(
        makeTimerKey(recipe?.id),
        null
      );
      const startMs =
        startMsRef.current ??
        (persisted && step
          ? persisted.stepId === step.id
            ? persisted.startMs
            : null
          : null);
      if (startMs == null) return;
      const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const nextRemaining = Math.max(0, duration - elapsedSec);
      setRemaining(nextRemaining);
      if (nextRemaining <= 0) {
        setRunning(false);
        saveJson<PersistedTimer>(makeTimerKey(recipe?.id), null);
        startMsRef.current = null;
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (!timerRef.current) {
        // Restart ticking if interval was cleared by the browser
        timerRef.current = window.setInterval(() => {
          const persistedInner = loadJson<PersistedTimer>(
            makeTimerKey(recipe?.id),
            null
          );
          const sMs =
            startMsRef.current ??
            (persistedInner && step
              ? persistedInner.stepId === step.id
                ? persistedInner.startMs
                : null
              : null);
          if (sMs == null) return;
          const e = Math.max(0, Math.floor((Date.now() - sMs) / 1000));
          const rem = Math.max(
            0,
            (allSteps[currentIndex]?.durationSec ?? 0) - e
          );
          setRemaining(rem);
          if (rem <= 0) {
            setRunning(false);
            saveJson<PersistedTimer>(makeTimerKey(recipe?.id), null);
            startMsRef.current = null;
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }, 1000);
      }
    };
    window.addEventListener("visibilitychange", handler);
    window.addEventListener("focus", handler);
    return () => {
      window.removeEventListener("visibilitychange", handler);
      window.removeEventListener("focus", handler);
    };
  }, [running, allSteps, currentIndex, recipe?.id]);

  // Note: Do not reset on allSteps recalculation; timekeeping uses wall clock.

  // Rehydrate running timer from storage (survives tab sleep/reload)
  useEffect(() => {
    const step = allSteps[currentIndex];
    const duration = step?.durationSec ?? 0;
    if (!duration || !step) return;
    const persisted = loadJson<PersistedTimer>(makeTimerKey(recipe?.id), null);
    if (persisted && persisted.stepId === step.id) {
      startMsRef.current = persisted.startMs;
      const elapsedSec = Math.max(
        0,
        Math.floor((Date.now() - persisted.startMs) / 1000)
      );
      const nextRemaining = Math.max(0, duration - elapsedSec);
      setRemaining(nextRemaining);
      if (nextRemaining > 0) setRunning(true);
      else {
        saveJson<PersistedTimer>(makeTimerKey(recipe?.id), null);
        startMsRef.current = null;
      }
    }
  }, [allSteps, currentIndex, recipe?.id]);

  // Sections rail metadata (Brewfather-like)
  const sections = useMemo(() => {
    type Section = {
      key: "Mash" | "Boil" | "Whirlpool" | "Fermentation";
      start: number;
      end: number;
    };
    const init: Record<Section["key"], { start: number; end: number }> = {
      Mash: { start: -1, end: -1 },
      Boil: { start: -1, end: -1 },
      Whirlpool: { start: -1, end: -1 },
      Fermentation: { start: -1, end: -1 },
    };
    const mapPhaseToSection = (p: BrewPhase): Section["key"] | null => {
      if (p === "prep" || p === "mash") return "Mash";
      if (p === "boil") return "Boil";
      if (p === "whirlpool") return "Whirlpool";
      if (p === "fermentation") return "Fermentation";
      return null;
    };
    allSteps.forEach((s, i) => {
      const sec = mapPhaseToSection(s.phase);
      if (!sec) return;
      if (init[sec].start === -1) init[sec].start = i;
      init[sec].end = i;
    });
    const order: Section["key"][] = [
      "Mash",
      "Boil",
      "Whirlpool",
      "Fermentation",
    ];
    return order.map((k) => ({
      key: k,
      start: init[k].start,
      end: init[k].end,
    }));
  }, [allSteps]);

  if (!recipe) {
    return (
      <div className="section-soft">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-primary-strong">Brew Mode</div>
          <Link className="btn-subtle" to="/recipes">
            Back to Recipes
          </Link>
        </div>
        <div className="mt-2">Recipe not found.</div>
      </div>
    );
  }

  const step = allSteps[currentIndex];
  const upcoming = allSteps.slice(currentIndex + 1, currentIndex + 6);
  const progressPct =
    allSteps.length > 0
      ? Math.round(((currentIndex + 1) / allSteps.length) * 100)
      : 0;

  return (
    <div className="page-brew space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Brew: {recipe.name}
          </h1>
          <div className="text-sm text-white/60">
            Step {currentIndex + 1} of {allSteps.length} • {progressPct}%
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-subtle" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link className="btn-neon" to="/recipes">
            Open Recipe
          </Link>
        </div>
      </div>

      {/* Simple section rail like Brewfather */}
      <div className="section-soft">
        <div className="flex items-center gap-4 text-sm">
          {sections.map((sec) => {
            const hasSteps = sec.start >= 0 && sec.end >= 0;
            const inSection =
              hasSteps && currentIndex >= sec.start && currentIndex <= sec.end;
            const completed = hasSteps && currentIndex > sec.end;
            const className = [
              inSection ? "text-white font-semibold" : "text-white/60",
              completed ? "line-through" : "",
              hasSteps ? "cursor-pointer" : "opacity-30 cursor-not-allowed",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={sec.key}
                type="button"
                className={className}
                disabled={!hasSteps}
                onClick={() => {
                  if (!hasSteps) return;
                  const target = completed ? sec.end : sec.start;
                  setRunning(false);
                  setCurrentIndex(target);
                }}
              >
                {sec.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section-soft">
        <div className="text-xs text-white/50 mb-2 uppercase tracking-wider flex items-center gap-2">
          <span>Current Step</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-300">
            <span className="relative inline-flex">
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
            </span>
            Now
          </span>
        </div>
        <div className="rounded-md border p-4 bg-black/30 ring-2 ring-orange-400/30 border-orange-400/30 shadow-lg shadow-orange-500/20">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-white/60">{step.phase}</div>
            <div className="text-xl font-semibold">{step.label}</div>
            {step.details ? (
              <div className="text-white/70">{step.details}</div>
            ) : null}
            {step.detailsList && step.detailsList.length ? (
              <ul className="list-disc list-inside text-white/70 space-y-0.5 mt-1">
                {step.detailsList.map((li, idx) => (
                  <li key={idx}>{li}</li>
                ))}
              </ul>
            ) : null}
          </div>
          {step.durationSec ? (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-4xl tabular-nums">
                {formatClock(remaining)}
              </div>
              <div className="flex items-center gap-2">
                {!running ? (
                  <button
                    className="btn-neon"
                    onClick={() => {
                      const step = allSteps[currentIndex];
                      const duration = step?.durationSec ?? 0;
                      if (!duration) return;
                      const nowMs = Date.now();
                      const startMs =
                        remaining < duration
                          ? nowMs - (duration - remaining) * 1000
                          : nowMs;
                      startMsRef.current = startMs;
                      if (step) {
                        const payload: PersistedTimer = {
                          stepId: step.id,
                          startMs,
                        };
                        saveJson<PersistedTimer>(
                          makeTimerKey(recipe?.id),
                          payload
                        );
                      }
                      setRunning(true);
                    }}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    className="btn-subtle"
                    onClick={() => {
                      setRunning(false);
                      saveJson<PersistedTimer>(makeTimerKey(recipe?.id), null);
                      startMsRef.current = null;
                    }}
                  >
                    Pause
                  </button>
                )}
                <button
                  className="btn-subtle"
                  onClick={() => {
                    setRunning(false);
                    setRemaining(step.durationSec || 0);
                    saveJson<PersistedTimer>(makeTimerKey(recipe?.id), null);
                    startMsRef.current = null;
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            <button
              className="btn-subtle"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              Prev
            </button>
            <button
              className="btn-neon"
              onClick={() =>
                setCurrentIndex((i) => Math.min(allSteps.length - 1, i + 1))
              }
              disabled={currentIndex >= allSteps.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="section-soft">
        <div className="text-xs text-white/50 mb-2 uppercase tracking-wider">
          Upcoming
        </div>
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <div className="text-white/60">No more steps.</div>
          ) : (
            upcoming.map((s) => (
              <div
                key={s.id}
                className={[
                  "rounded border p-3",
                  "border-white/10 bg-black/20",
                ].join(" ")}
              >
                <div className="text-xs text-white/50">{s.phase}</div>
                <div className="font-medium">{s.label}</div>
                {s.details ? (
                  <div className="text-white/70 text-sm">{s.details}</div>
                ) : null}
                {s.detailsList && s.detailsList.length ? (
                  <ul className="list-disc list-inside text-white/70 text-sm">
                    {s.detailsList.map((li, idx) => (
                      <li key={idx}>{li}</li>
                    ))}
                  </ul>
                ) : null}
                {s.durationSec ? (
                  <div className="text-white/60 text-sm mt-1">
                    Timer: {formatClock(s.durationSec)}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
