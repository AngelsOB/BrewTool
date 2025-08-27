import { useEffect, useMemo, useState } from "react";
import Collapsible from "./Collapsible";

type YeastType = "liquid-100" | "liquid-200" | "dry" | "slurry";

type WhiteModelAeration = "none" | "shaking";
type GrowthModel =
  | { kind: "white"; aeration: WhiteModelAeration }
  | { kind: "braukaiser" };

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function sgToPlato(sg: number): number {
  const s2 = sg * sg;
  const s3 = s2 * sg;
  return -616.868 + 1111.14 * sg - 630.272 * s2 + 135.997 * s3;
}

function dmeGramsForGravity(
  liters: number,
  gravity: number,
  dmePpg = 45
): number {
  const points = Math.max(0, (gravity - 1) * 1000);
  const gallons = liters * 0.264172;
  const pounds = (points * gallons) / Math.max(0.0001, dmePpg);
  return pounds * 453.59237; // grams
}

function whiteModelGrowthFactorB(
  currentBillion: number,
  liters: number,
  aeration: WhiteModelAeration
): { growthFactor: number; endBillion: number } {
  const inoculationRateBPerL = currentBillion / Math.max(0.0001, liters);
  const base =
    12.54793776 * Math.pow(inoculationRateBPerL, -0.4594858324) - 0.9994994906;
  const aerationBoost = aeration === "shaking" ? 0.5 : 0;
  const growthFactor = clamp(base + aerationBoost, 0, 6);
  const saturationB = 200 * liters;
  const proposed = currentBillion * (1 + growthFactor);
  const endBillion = Math.min(saturationB, proposed);
  return { growthFactor, endBillion };
}

function braukaiserGrowth(
  currentBillion: number,
  liters: number,
  gravity: number
): { growthBillion: number; endBillion: number } {
  const grams = dmeGramsForGravity(liters, gravity, 45);
  // Constant B/g as per common Braukaiser usage and Brewer's Friend parity
  const bPerGram = 1.4;
  const growthBillion = grams * bPerGram;
  // Braukaiser model has no intrinsic upper growth limit (BF notes this explicitly)
  const endBillion = currentBillion + growthBillion;
  return { growthBillion, endBillion };
}

export default function YeastPitchCalc({
  og,
  volumeL,
  onChange,
}: {
  og: number;
  volumeL: number;
  onChange?: (state: {
    yeastType: YeastType;
    packs: number;
    mfgDate: string;
    slurryLiters: number;
    slurryBillionPerMl: number;
    steps: Array<{
      id: string;
      liters: number;
      gravity: number;
      model: GrowthModel;
      dmeGrams: number;
      endBillion: number;
    }>;
    requiredCellsB: number;
    cellsAvailableB: number;
    finalEndB: number;
    totalStarterL: number;
    totalDmeG: number;
  }) => void;
}) {
  const [open, setOpen] = useState<boolean>(false);

  // Part 1: Required cells
  const pitchRate = 0.75; // fixed default (ale)
  const plato = useMemo(() => sgToPlato(og || 1.05), [og]);
  const requiredCellsB = useMemo(
    () => pitchRate * Math.max(0, volumeL) * Math.max(0, plato),
    [volumeL, plato]
  );

  // Package inputs (simplified)
  const [yeastType, setYeastType] = useState<YeastType>("liquid-100");
  const [packs, setPacks] = useState<number>(1);
  const [mfgDate, setMfgDate] = useState<string>("");
  const [slurryLiters, setSlurryLiters] = useState<number>(0);
  const [slurryBillionPerMl, setSlurryBillionPerMl] = useState<number>(1);

  // Compute cells available from package info
  const cellsAvailableB = useMemo(() => {
    if (yeastType === "dry") {
      // Treat packs as 11 g sachets; default density 6B/g
      const grams = Math.max(0, Math.floor(packs)) * 11;
      const densityBPerG = 6;
      return grams * densityBPerG;
    }
    if (yeastType === "slurry") {
      return Math.max(0, slurryLiters) * 1000 * Math.max(0, slurryBillionPerMl);
    }
    const basePerPack = yeastType === "liquid-200" ? 200 : 100;
    const numPacks = Math.max(0, Math.floor(packs));
    if (!mfgDate) return numPacks * basePerPack;
    const made = new Date(mfgDate).getTime();
    if (Number.isNaN(made)) return numPacks * basePerPack;
    const days = Math.max(
      0,
      Math.floor((Date.now() - made) / (24 * 60 * 60 * 1000))
    );
    const viability = clamp(1 - 0.007 * days, 0, 1);
    return numPacks * basePerPack * viability;
  }, [yeastType, packs, mfgDate, slurryLiters, slurryBillionPerMl]);

  const diffB = useMemo(
    () => cellsAvailableB - requiredCellsB,
    [requiredCellsB, cellsAvailableB]
  );

  // Part 2: Starters up to 3 steps
  type StarterStep = {
    id: string;
    liters: number;
    gravity: number; // e.g., 1.036
    model: GrowthModel;
  };
  const startingCellsB = cellsAvailableB;
  const [steps, setSteps] = useState<StarterStep[]>([]);

  const stepResults = useMemo(() => {
    const out: Array<{
      id: string;
      dmeGrams: number;
      endBillion: number;
    }> = [];
    let current = Math.max(0, startingCellsB);
    for (const step of steps) {
      const dmeG = dmeGramsForGravity(step.liters, step.gravity, 45);
      if (step.model.kind === "white") {
        const { endBillion } = whiteModelGrowthFactorB(
          current,
          step.liters,
          step.model.aeration
        );
        current = endBillion;
        out.push({ id: step.id, dmeGrams: dmeG, endBillion });
      } else {
        const { endBillion } = braukaiserGrowth(
          current,
          step.liters,
          step.gravity
        );
        current = endBillion;
        out.push({ id: step.id, dmeGrams: dmeG, endBillion });
      }
    }
    return out;
  }, [steps, startingCellsB]);

  const finalEndB = useMemo(
    () =>
      stepResults.length
        ? stepResults[stepResults.length - 1].endBillion
        : startingCellsB,
    [stepResults, startingCellsB]
  );
  const finalDiffB = useMemo(
    () => finalEndB - requiredCellsB,
    [finalEndB, requiredCellsB]
  );

  const totalStarterL = useMemo(
    () => steps.reduce((sum, s) => sum + (Number(s.liters) || 0), 0),
    [steps]
  );
  const totalDmeG = useMemo(
    () =>
      steps.reduce(
        (sum, s) => sum + dmeGramsForGravity(s.liters, s.gravity, 45),
        0
      ),
    [steps]
  );
  const summaryText = useMemo(() => {
    if (open) return "";
    const yeastInfo = (() => {
      if (yeastType === "slurry") {
        return `Slurry ${slurryLiters.toFixed(
          1
        )} L @ ${slurryBillionPerMl.toFixed(1)} B/mL`;
      }
      if (yeastType === "dry") {
        const n = Math.max(0, Math.floor(packs));
        return `Dry ${n}×11g`;
      }
      const label =
        yeastType === "liquid-200" ? "Liquid (200B)" : "Liquid (100B)";
      const n = Math.max(0, Math.floor(packs));
      const mfgPart = mfgDate ? `(Mfg ${mfgDate})` : "";
      return `${n} pack${n === 1 ? "" : "s"} of ${label} ${mfgPart}`;
    })();

    if (totalStarterL > 0 && steps.length > 0) {
      const last = steps[steps.length - 1];
      const starterInfo = `${last.liters.toFixed(1)}L Starter @ ${Number(
        last.gravity
      ).toFixed(3)}`;
      return `${yeastInfo} in a ${starterInfo}`;
    }

    return yeastInfo;
  }, [
    open,
    steps,
    totalStarterL,
    yeastType,
    packs,
    slurryLiters,
    slurryBillionPerMl,
    mfgDate,
  ]);

  // Emit snapshot for parent consumers of starter state
  useEffect(() => {
    if (!onChange) return;
    const combined = steps.map((s, i) => ({
      id: s.id,
      liters: s.liters,
      gravity: s.gravity,
      model: s.model,
      dmeGrams:
        stepResults[i]?.dmeGrams ?? dmeGramsForGravity(s.liters, s.gravity, 45),
      endBillion: stepResults[i]?.endBillion ?? Number.NaN,
    }));
    onChange({
      yeastType,
      packs,
      mfgDate,
      slurryLiters,
      slurryBillionPerMl,
      steps: combined,
      requiredCellsB,
      cellsAvailableB,
      finalEndB,
      totalStarterL,
      totalDmeG,
    });
  }, [
    onChange,
    yeastType,
    packs,
    mfgDate,
    slurryLiters,
    slurryBillionPerMl,
    steps,
    stepResults,
    requiredCellsB,
    cellsAvailableB,
    finalEndB,
    totalStarterL,
    totalDmeG,
  ]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">Pitch Rate & Starter</div>
        {!open && summaryText && (
          <div className="text-xs text-white/50">{summaryText}</div>
        )}
        <button
          type="button"
          className="text-xs rounded-md border px-2 py-1 text-white/40 shadow-lg shadow-black/30 hover:shadow-sm hover:bg-white/10"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide Calculator" : "Show Calculator"}
        </button>
      </div>
      <Collapsible open={open}>
        <section className="grid grid-cols-1 gap-3">
          {/* Part 1 */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-3 shadow-md shadow-black/30">
            <div className="text-sm font-semibold text-primary-strong">
              Part 1: Cells
            </div>
            {/* Row 1: Package type + conditional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <label className="block">
                <div className="text-xs text-muted mb-1">Package Type</div>
                <select
                  className="w-full rounded-md border px-2 py-2.5"
                  value={yeastType}
                  onChange={(e) => setYeastType(e.target.value as YeastType)}
                >
                  <option value="liquid-100">Liquid (100B)</option>
                  <option value="liquid-200">Liquid (200B)</option>
                  <option value="dry">Dry (11g pkt)</option>
                  <option value="slurry">Slurry</option>
                </select>
              </label>
              {yeastType === "slurry" ? (
                <>
                  <label className="block">
                    <div className="text-xs text-muted mb-1">
                      Slurry Amount (L)
                    </div>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      type="number"
                      step={0.1}
                      min={0}
                      value={slurryLiters}
                      onChange={(e) => setSlurryLiters(Number(e.target.value))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs text-muted mb-1">
                      Slurry Density (B/mL)
                    </div>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      type="number"
                      step={0.1}
                      min={0}
                      value={slurryBillionPerMl}
                      onChange={(e) =>
                        setSlurryBillionPerMl(Number(e.target.value))
                      }
                    />
                  </label>
                </>
              ) : yeastType === "dry" ? (
                <>
                  <label className="block">
                    <div className="text-xs text-muted mb-1">Packs</div>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      type="number"
                      step={1}
                      min={0}
                      value={packs}
                      onChange={(e) => setPacks(Number(e.target.value))}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <div className="text-xs text-muted mb-1">Packs</div>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      type="number"
                      step={1}
                      min={0}
                      value={packs}
                      onChange={(e) => setPacks(Number(e.target.value))}
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs text-muted mb-1">Mfg Date</div>
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                    />
                  </label>
                </>
              )}
            </div>
            {/* Row 2: Inline, non-editable text */}
            <div className="text-sm text-neutral-800 flex flex-wrap gap-x-6 gap-y-2">
              <span>
                <span className="text-neutral-600">Available:</span>{" "}
                <span className="font-semibold text-neutral-400">
                  {cellsAvailableB.toFixed(0)} B
                </span>
              </span>
              <span>
                <span className="text-neutral-600">Required:</span>{" "}
                <span className="font-semibold text-neutral-400">
                  {requiredCellsB.toFixed(0)} B
                </span>
              </span>
              <span>
                <span className="text-neutral-600">Diff:</span>{" "}
                <span
                  className={`font-semibold ${
                    diffB < 0 ? "text-red-700" : "text-emerald-600"
                  }`}
                >
                  {(diffB >= 0 ? "+" : "-") + Math.abs(diffB).toFixed(0)} B
                </span>
              </span>
            </div>
          </div>

          {/* Part 2 */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-3">
            <div className="text-sm font-semibold text-primary-strong">
              Part 2: Starter (up to 3 steps)
            </div>
            <div className="space-y-3">
              {steps.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content] -mb-1">
                  <div className="sm:col-start-7 sm:col-span-1 justify-self-end text-sm -translate-x-11.5 translate-y-5">
                    <span className="text-white/40">Required:</span>{" "}
                    <span className="font-semibold text-neutral-400">
                      {requiredCellsB.toFixed(0)} B
                    </span>
                  </div>
                </div>
              )}
              {steps.map((s, i) => {
                const res = stepResults[i];
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-1 gap-3 items-end sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content]"
                  >
                    <div className="text-xs text-muted sm:col-span-8">
                      Step {i + 1}
                    </div>
                    <label className="block sm:col-span-2">
                      <div className="text-xs text-muted mb-1">Size (L)</div>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        type="number"
                        step={0.1}
                        value={s.liters}
                        onChange={(e) =>
                          setSteps((xs) =>
                            xs.map((x) =>
                              x.id === s.id
                                ? { ...x, liters: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <div className="text-xs text-muted mb-1">
                        Gravity (SG)
                      </div>
                      <input
                        className="w-full rounded-md border px-3 py-2"
                        type="number"
                        step={0.001}
                        value={s.gravity}
                        onChange={(e) =>
                          setSteps((xs) =>
                            xs.map((x) =>
                              x.id === s.id
                                ? { ...x, gravity: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                      />
                    </label>
                    <label className="block">
                      <div className="text-xs text-muted mb-1">Model</div>
                      <select
                        className="w-full rounded-md border px-2 py-2.5"
                        value={
                          s.model.kind === "white"
                            ? `white-${s.model.aeration}`
                            : "braukaiser"
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          setSteps((xs) =>
                            xs.map((x) =>
                              x.id === s.id
                                ? v.startsWith("white-")
                                  ? {
                                      ...x,
                                      model: {
                                        kind: "white",
                                        aeration: v.replace(
                                          "white-",
                                          ""
                                        ) as WhiteModelAeration,
                                      },
                                    }
                                  : { ...x, model: { kind: "braukaiser" } }
                                : x
                            )
                          );
                        }}
                      >
                        <option value="white-none">
                          No agitation - C. White
                        </option>
                        <option value="white-shaking">
                          Shaking - C. White
                        </option>
                        <option value="braukaiser">
                          Stir Plate - Braukaiser
                        </option>
                      </select>
                    </label>
                    <div className="rounded-md border px-3 py-2 bg-white/5 sm:col-span-1">
                      <div className="text-[11px] text-white/40">
                        DME Required
                      </div>
                      <div className="font-semibold">
                        {(
                          res?.dmeGrams ??
                          dmeGramsForGravity(s.liters, s.gravity)
                        ).toFixed(0)}{" "}
                        g
                      </div>
                    </div>
                    <div className="rounded-md border px-3 py-2 bg-white/5 sm:col-span-1">
                      <div className="text-[11px] text-white/40">End Cells</div>
                      <div className="font-semibold">
                        {res ? res.endBillion.toFixed(0) : "–"} B
                      </div>
                    </div>
                    <div className="flex justify-end items-center">
                      <button
                        type="button"
                        className="p-2 text-neutral-400 hover:text-red-500"
                        onClick={() =>
                          setSteps((xs) => xs.filter((x) => x.id !== s.id))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
              {steps.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_min-content] -mt-1">
                  <div className="sm:col-start-7 sm:col-span-1 justify-self-end text-sm -translate-x-11.5 translate-y-0.5">
                    <span className="text-white/40">Diff:</span>{" "}
                    <span
                      className={`font-semibold ${
                        finalDiffB < 0 ? "text-red-700" : "text-emerald-600"
                      }`}
                    >
                      {(finalDiffB >= 0 ? "+" : "-") +
                        Math.abs(finalDiffB).toFixed(0)}{" "}
                      B
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-start">
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-xs hover:bg-neutral-50"
                  onClick={() =>
                    setSteps((xs) =>
                      xs.length >= 3
                        ? xs
                        : [
                            ...xs,
                            {
                              id: crypto.randomUUID(),
                              liters: 2,
                              gravity: 1.036,
                              model: { kind: "white", aeration: "shaking" },
                            },
                          ]
                    )
                  }
                >
                  + Add Step
                </button>
              </div>
            </div>
          </div>
        </section>
      </Collapsible>
    </div>
  );
}
