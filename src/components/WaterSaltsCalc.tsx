import { useMemo, useState } from "react";
import CalculatorCard from "./CalculatorCard";
import {
  type SaltAdditions,
  type WaterProfile,
  COMMON_WATER_PROFILES,
  ionDeltaFromSalts,
  mixProfiles,
  ION_KEYS,
  DEFAULT_TOLERANCE_PPM,
  loadSavedWaterProfiles,
  saveNewWaterProfile,
  updateSavedWaterProfile,
  type SavedWaterProfile,
} from "../utils/water";
import InputWithSuffix from "./InputWithSuffix";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm text-neutral-700 mb-1">{label}</div>
      {children}
    </label>
  );
}

export default function WaterSaltsCalc({
  mashWaterL = 15,
  spargeWaterL = 10,
  variant = "card",
}: {
  mashWaterL?: number;
  spargeWaterL?: number;
  variant?: "card" | "embedded";
}) {
  const [sourceProfileName, setSourceProfileName] = useState<string>("RO");
  const [targetProfileName, setTargetProfileName] = useState<string>("Burton");
  const [customSource, setCustomSource] = useState<WaterProfile | null>(null);
  const [customTarget, setCustomTarget] = useState<WaterProfile | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<SavedWaterProfile[]>(() =>
    loadSavedWaterProfiles()
  );
  const [customSourceName, setCustomSourceName] =
    useState<string>("Custom Source");
  const [customTargetName, setCustomTargetName] =
    useState<string>("Custom Target");
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [mashVol, setMashVol] = useState<number>(mashWaterL);
  const [spargeVol, setSpargeVol] = useState<number>(spargeWaterL);

  // Use live recipe-provided volumes when embedded to avoid drift; allow edits in card mode
  const effectiveMashVol = variant === "embedded" ? mashWaterL : mashVol;
  const effectiveSpargeVol = variant === "embedded" ? spargeWaterL : spargeVol;
  const [mashSalts, setMashSalts] = useState<SaltAdditions>({});
  const [spargeSalts, setSpargeSalts] = useState<SaltAdditions>({});
  const [singleSalts, setSingleSalts] = useState<SaltAdditions>({});
  const [additionsMode, setAdditionsMode] = useState<"single" | "separate">(
    "single"
  );
  const [autoSplitByVolume, setAutoSplitByVolume] = useState<boolean>(true);
  const [manualMashPercent] = useState<number>(50);

  const totalWater =
    Math.max(0, effectiveMashVol) + Math.max(0, effectiveSpargeVol);
  const mashFrac =
    totalWater > 0 ? Math.max(0, effectiveMashVol) / totalWater : 0;

  const splitMashFrac = autoSplitByVolume
    ? mashFrac
    : Math.max(0, Math.min(1, manualMashPercent / 100));
  const splitSpargeFrac = 1 - splitMashFrac;

  const computedMashSalts: SaltAdditions = useMemo(() => {
    if (additionsMode !== "single") return mashSalts;
    return {
      gypsum_g: (singleSalts.gypsum_g ?? 0) * splitMashFrac,
      cacl2_g: (singleSalts.cacl2_g ?? 0) * splitMashFrac,
      epsom_g: (singleSalts.epsom_g ?? 0) * splitMashFrac,
      nacl_g: (singleSalts.nacl_g ?? 0) * splitMashFrac,
      nahco3_g: (singleSalts.nahco3_g ?? 0) * splitMashFrac,
    };
  }, [
    additionsMode,
    mashSalts,
    singleSalts.gypsum_g,
    singleSalts.cacl2_g,
    singleSalts.epsom_g,
    singleSalts.nacl_g,
    singleSalts.nahco3_g,
    splitMashFrac,
  ]);

  const computedSpargeSalts: SaltAdditions = useMemo(() => {
    if (additionsMode !== "single") return spargeSalts;
    return {
      gypsum_g: (singleSalts.gypsum_g ?? 0) * splitSpargeFrac,
      cacl2_g: (singleSalts.cacl2_g ?? 0) * splitSpargeFrac,
      epsom_g: (singleSalts.epsom_g ?? 0) * splitSpargeFrac,
      nacl_g: (singleSalts.nacl_g ?? 0) * splitSpargeFrac,
      nahco3_g: (singleSalts.nahco3_g ?? 0) * splitSpargeFrac,
    };
  }, [
    additionsMode,
    spargeSalts,
    singleSalts.gypsum_g,
    singleSalts.cacl2_g,
    singleSalts.epsom_g,
    singleSalts.nacl_g,
    singleSalts.nahco3_g,
    splitSpargeFrac,
  ]);

  const source: WaterProfile = useMemo(() => {
    if (sourceProfileName === "Custom" && customSource) return customSource;
    return COMMON_WATER_PROFILES[sourceProfileName] ?? COMMON_WATER_PROFILES.RO;
  }, [sourceProfileName, customSource]);

  const target: WaterProfile = useMemo(() => {
    if (targetProfileName === "Custom" && customTarget) return customTarget;
    return (
      COMMON_WATER_PROFILES[targetProfileName] ?? COMMON_WATER_PROFILES.Burton
    );
  }, [targetProfileName, customTarget]);

  const mashProfile = useMemo(() => {
    const delta = ionDeltaFromSalts(computedMashSalts, effectiveMashVol);
    return {
      Ca: source.Ca + delta.Ca,
      Mg: source.Mg + delta.Mg,
      Na: source.Na + delta.Na,
      Cl: source.Cl + delta.Cl,
      SO4: source.SO4 + delta.SO4,
      HCO3: source.HCO3 + delta.HCO3,
    };
  }, [source, computedMashSalts, effectiveMashVol]);

  const spargeProfile = useMemo(() => {
    const delta = ionDeltaFromSalts(computedSpargeSalts, effectiveSpargeVol);
    return {
      Ca: source.Ca + delta.Ca,
      Mg: source.Mg + delta.Mg,
      Na: source.Na + delta.Na,
      Cl: source.Cl + delta.Cl,
      SO4: source.SO4 + delta.SO4,
      HCO3: source.HCO3 + delta.HCO3,
    };
  }, [source, computedSpargeSalts, effectiveSpargeVol]);

  const totalProfile = useMemo(
    () =>
      mixProfiles([
        { volumeL: effectiveMashVol, profile: mashProfile },
        { volumeL: effectiveSpargeVol, profile: spargeProfile },
      ]),
    [effectiveMashVol, effectiveSpargeVol, mashProfile, spargeProfile]
  );

  // const ratio = useMemo(() => chlorideToSulfateRatio(totalProfile), [totalProfile]);

  const content = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Source Water">
          <select
            className="w-full rounded-md border px-2 py-2.5"
            value={sourceProfileName}
            onChange={(e) => setSourceProfileName(e.target.value)}
          >
            {[
              ...Object.keys(COMMON_WATER_PROFILES),
              ...savedProfiles.map((s) => `saved:${s.id}`),
              "Custom",
            ].map((k) => (
              <option key={k} value={k}>
                {k.startsWith("saved:")
                  ? savedProfiles.find((s) => `saved:${s.id}` === k)?.name ?? k
                  : k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Target Water">
          <select
            className="w-full rounded-md border px-2 py-2.5"
            value={targetProfileName}
            onChange={(e) => setTargetProfileName(e.target.value)}
          >
            {[
              ...Object.keys(COMMON_WATER_PROFILES),
              ...savedProfiles.map((s) => `saved:${s.id}`),
              "Custom",
            ].map((k) => (
              <option key={k} value={k}>
                {k.startsWith("saved:")
                  ? savedProfiles.find((s) => `saved:${s.id}` === k)?.name ?? k
                  : k}
              </option>
            ))}
          </select>
        </Field>
        {variant === "card" ? (
          <>
            <Field label="Mash Volume">
              <InputWithSuffix
                value={mashVol}
                onChange={setMashVol}
                step={0.1}
                suffix=" L"
                suffixClassName="right-3 text-[10px]"
              />
            </Field>
            <Field label="Sparge Volume">
              <InputWithSuffix
                value={spargeVol}
                onChange={setSpargeVol}
                step={0.1}
                suffix=" L"
                suffixClassName="right-3 text-[10px]"
              />
            </Field>
          </>
        ) : (
          <>
            <div className="flex flex-col justify-center text-sm py-6 text-neutral-700">
              <div>Mash: {effectiveMashVol.toFixed(1)} L</div>
              <div>Sparge: {effectiveSpargeVol.toFixed(1)} L</div>
            </div>
            <div />
          </>
        )}
      </div>

      {/* Mode toggle moved inline with checkbox in single mode; also rendered in separate mode section */}

      {/* Inline custom editors when Custom is selected */}
      {(sourceProfileName === "Custom" || targetProfileName === "Custom") && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sourceProfileName === "Custom" && (
            <CustomProfileEditor
              title="Custom Source"
              value={customSource}
              onChange={(p) => setCustomSource(p)}
              variant={variant}
              name={customSourceName}
              onNameChange={setCustomSourceName}
              onSave={() => {
                if (!customSource) return;
                if (editingSourceId) {
                  const updated = updateSavedWaterProfile(
                    editingSourceId,
                    customSourceName,
                    customSource
                  );
                  if (updated) setSavedProfiles(loadSavedWaterProfiles());
                } else {
                  const saved = saveNewWaterProfile(
                    customSourceName,
                    customSource
                  );
                  setSavedProfiles(loadSavedWaterProfiles());
                  setEditingSourceId(saved.id);
                }
              }}
            />
          )}
          {targetProfileName === "Custom" && (
            <CustomProfileEditor
              title="Custom Target"
              value={customTarget}
              onChange={(p) => setCustomTarget(p)}
              variant={variant}
              name={customTargetName}
              onNameChange={setCustomTargetName}
              onSave={() => {
                if (!customTarget) return;
                if (editingTargetId) {
                  const updated = updateSavedWaterProfile(
                    editingTargetId,
                    customTargetName,
                    customTarget
                  );
                  if (updated) setSavedProfiles(loadSavedWaterProfiles());
                } else {
                  const saved = saveNewWaterProfile(
                    customTargetName,
                    customTarget
                  );
                  setSavedProfiles(loadSavedWaterProfiles());
                  setEditingTargetId(saved.id);
                }
              }}
            />
          )}
        </div>
      )}

      {/* Profile comparison above additions */}
      <ProfileDiff
        source={source}
        target={target}
        adjusted={totalProfile}
        variant={variant}
      />

      {additionsMode === "single" ? (
        <div className="mt-4">
          <div className="font-medium mb-2">Salt Additions (total)</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {renderSaltInputs(singleSalts, setSingleSalts)}
          </div>
          <div className="mt-2 text-xs text-neutral-600 flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSplitByVolume}
                onChange={(e) => setAutoSplitByVolume(e.target.checked)}
              />
              Auto split by volume
            </label>
            {autoSplitByVolume && (
              <span>
                Mash {effectiveMashVol.toFixed(1)} L • Sparge{" "}
                {effectiveSpargeVol.toFixed(1)} L
              </span>
            )}
            {/* Right-aligned mode toggle */}
            <div className="ml-auto flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="saltmode"
                  checked={true}
                  onChange={() => setAdditionsMode("single")}
                />
                Single input (auto split)
              </label>
              <span className="text-neutral-500">•</span>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="saltmode"
                  checked={false}
                  onChange={() => setAdditionsMode("separate")}
                />
                Separate mash and sparge
              </label>
            </div>
          </div>
          {autoSplitByVolume && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {renderSplitPreview(computedMashSalts, computedSpargeSalts)}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-medium mb-2">Mash Additions</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {renderSaltInputs(mashSalts, setMashSalts)}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Sparge Additions</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {renderSaltInputs(spargeSalts, setSpargeSalts)}
              </div>
            </div>
          </div>
          {/* Bottom right-aligned mode toggle */}
          <div className="mt-3 text-xs text-neutral-600 flex items-center">
            <div className="ml-auto flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="saltmode"
                  checked={false}
                  onChange={() => setAdditionsMode("single")}
                />
                Single input (auto split)
              </label>
              <span className="text-neutral-500">•</span>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="saltmode"
                  checked={true}
                  onChange={() => setAdditionsMode("separate")}
                />
                Separate mash and sparge
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Removed separate Mash/Sparge/Adjusted cards; Profile Match covers it */}
    </>
  );

  if (variant === "embedded") {
    return <div className="space-y-3">{content}</div>;
  }
  return <CalculatorCard title="Water Salts">{content}</CalculatorCard>;
}

function renderSaltInputs(
  values: SaltAdditions,
  setValues: (s: SaltAdditions) => void
) {
  const update = (k: keyof SaltAdditions, v: number) =>
    setValues({ ...values, [k]: v });
  return (
    <>
      <Field label="Gypsum (CaSO4)">
        <InputWithSuffix
          value={values.gypsum_g ?? 0}
          onChange={(n) => update("gypsum_g", n)}
          step={0.1}
          suffix=" g"
          suffixClassName="right-3 text-[10px]"
        />
      </Field>
      <Field label="Calcium Chloride (CaCl2)">
        <InputWithSuffix
          value={values.cacl2_g ?? 0}
          onChange={(n) => update("cacl2_g", n)}
          step={0.1}
          suffix=" g"
          suffixClassName="right-3 text-[10px]"
        />
      </Field>
      <Field label="Epsom Salt (MgSO4)">
        <InputWithSuffix
          value={values.epsom_g ?? 0}
          onChange={(n) => update("epsom_g", n)}
          step={0.1}
          suffix=" g"
          suffixClassName="right-3 text-[10px]"
        />
      </Field>
      <Field label="Table Salt (NaCl)">
        <InputWithSuffix
          value={values.nacl_g ?? 0}
          onChange={(n) => update("nacl_g", n)}
          step={0.1}
          suffix=" g"
          suffixClassName="right-3 text-[10px]"
        />
      </Field>
      <Field label="Baking Soda (NaHCO3)">
        <InputWithSuffix
          value={values.nahco3_g ?? 0}
          onChange={(n) => update("nahco3_g", n)}
          step={0.1}
          suffix=" g"
          suffixClassName="right-3 text-[10px]"
        />
      </Field>
    </>
  );
}

function renderSplitPreview(mash: SaltAdditions, sparge: SaltAdditions) {
  const Row = ({ label, m, s }: { label: string; m?: number; s?: number }) => (
    <div className="flex items-center justify-between rounded border px-2 py-1 bg-white/40">
      <span className="text-neutral-700">{label}</span>
      <span className="text-neutral-900 font-medium">
        M {m ? m.toFixed(1) : "0.0"} g • S {s ? s.toFixed(1) : "0.0"} g
      </span>
    </div>
  );
  return (
    <>
      <Row label="Gypsum (CaSO4)" m={mash.gypsum_g} s={sparge.gypsum_g} />
      <Row
        label="Calcium Chloride (CaCl2)"
        m={mash.cacl2_g}
        s={sparge.cacl2_g}
      />
      <Row label="Epsom (MgSO4)" m={mash.epsom_g} s={sparge.epsom_g} />
      <Row label="Table Salt (NaCl)" m={mash.nacl_g} s={sparge.nacl_g} />
      <Row label="Baking Soda (NaHCO3)" m={mash.nahco3_g} s={sparge.nahco3_g} />
    </>
  );
}

// Removed old IonCard display in favor of ProfileDiff

function CustomProfileEditor({
  title,
  value,
  onChange,
  variant = "card",
  name,
  onNameChange,
  onSave,
}: {
  title: string;
  value: WaterProfile | null;
  onChange: (p: WaterProfile) => void;
  variant?: "card" | "embedded";
  name?: string;
  onNameChange?: (s: string) => void;
  onSave?: () => void;
}) {
  const current: WaterProfile = value ?? {
    Ca: 0,
    Mg: 0,
    Na: 0,
    Cl: 0,
    SO4: 0,
    HCO3: 0,
  };
  const set = (k: keyof WaterProfile, v: number) =>
    onChange({ ...current, [k]: Math.max(0, v) });
  return (
    <div
      className={
        variant === "embedded"
          ? "rounded-xl border border-white/5 bg-white/10 p-3"
          : "rounded-xl border border-white/10 bg-white/20 p-3"
      }
    >
      <div className="font-medium mb-2 flex items-center gap-2">
        <span>{title}</span>
        <input
          className="flex-1 rounded-md border px-2 py-1 text-sm"
          placeholder="Profile name"
          value={name ?? ""}
          onChange={(e) => onNameChange?.(e.target.value)}
        />
        <button
          className="rounded-md border px-2 py-1 text-xs hover:bg-white/30"
          onClick={onSave}
          type="button"
        >
          Save
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ION_KEYS.map((k) => (
          <label key={k} className="block text-sm">
            <div className="text-neutral-700 mb-1">{k}</div>
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={current[k]}
              onChange={(e) => set(k, Number(e.target.value))}
              step={1}
              min={0}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function ProfileDiff({
  source,
  target,
  adjusted,
  tolerance = DEFAULT_TOLERANCE_PPM,
  variant = "card",
}: {
  source: WaterProfile;
  target: WaterProfile;
  adjusted: WaterProfile;
  tolerance?: number;
  variant?: "card" | "embedded";
}) {
  // (no expanded table; compact mode renders directly)
  const badge = (d: number) => {
    const abs = Math.abs(d);
    const within = abs <= tolerance;
    if (within) {
      return (
        <span className="rounded px-2 py-0.5 text-xs bg-emerald-600/60 text-white">
          {d.toFixed(0)}
        </span>
      );
    }
    const over = Math.max(0, abs - tolerance);
    const norm = Math.min(1, over / (tolerance * 5));
    const step = Math.min(5, Math.max(0, Math.floor(norm * 6)));
    if (d > 0) {
      const posBg = [
        "bg-yellow-400/30",
        "bg-yellow-500/40",
        "bg-yellow-600/50",
        "bg-yellow-700/60",
        "bg-yellow-700/70",
        "bg-yellow-800/80",
      ];
      return (
        <span
          className={`rounded px-2 py-0.5 text-xs ${posBg[step]} text-white`}
        >
          {d.toFixed(0)}
        </span>
      );
    } else {
      const negBg = [
        "bg-red-400/30",
        "bg-red-500/40",
        "bg-red-600/50",
        "bg-red-700/60",
        "bg-red-700/70",
        "bg-red-800/80",
      ];
      return (
        <span
          className={`rounded px-2 py-0.5 text-xs ${negBg[step]} text-white`}
        >
          {d.toFixed(0)}
        </span>
      );
    }
  };
  return (
    <div
      className={
        variant === "embedded"
          ? "mt-6 rounded-xl border border-white/5 bg-white/10 p-3"
          : "mt-6 rounded-xl border border-white/10 bg-white/20 p-3"
      }
    >
      <div className="mb-2 font-medium text-white/90">Profile Match</div>
      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 items-center">
          <div className="px-2 py-1 text-xs text-primary-strong" />
          {ION_KEYS.map((k) => (
            <div key={k} className="px-2 py-1 text-xs text-primary-strong">
              {k}
            </div>
          ))}
          <div />
        </div>
        <Row label="Source" values={source} badge={null} />
        <Row label="Target" values={target} badge={null} />
        <Row
          label="Adjusted"
          values={adjusted}
          badge={(k) => badge(adjusted[k] - target[k])}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  values,
  badge,
}: {
  label: string;
  values: WaterProfile;
  badge: null | ((k: keyof WaterProfile) => React.ReactNode);
}) {
  return (
    <div className="grid grid-cols-7 gap-1 items-center">
      <div className="px-2 py-1 text-xs text-primary">{label}</div>
      {ION_KEYS.map((k) => (
        <div key={k} className="px-2 py-1 text-sm flex items-center gap-2">
          <span>{values[k].toFixed(0)}</span>
          {badge ? <span>{badge(k)}</span> : null}
        </div>
      ))}
      <div />
    </div>
  );
}
