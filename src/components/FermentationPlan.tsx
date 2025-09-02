import { useMemo, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { FermentationStep } from "../modules/recipe/types";
import InputWithSuffix from "./InputWithSuffix";
import InlineEditableNumber from "./InlineEditableNumber";

type Props = {
  steps: FermentationStep[];
  onChange: (next: FermentationStep[]) => void;
  showDryHopColumn?: boolean;
};

const STAGE_LABEL: Record<NonNullable<FermentationStep["stage"]>, string> = {
  primary: "Primary",
  secondary: "Secondary",
  "diacetyl-rest": "Diacetyl Rest",
  conditioning: "Conditioning",
  "cold-crash": "Cold Crash",
  lagering: "Lagering",
  "keg-conditioning": "Keg Conditioning",
  "bottle-conditioning": "Bottle Conditioning",
  spunding: "Spunding",
};

export default function FermentationPlan({
  steps,
  onChange,
  showDryHopColumn,
}: Props) {
  const totalDays = useMemo(
    () => steps.reduce((acc, s) => acc + Math.max(0, s.days || 0), 0),
    [steps]
  );

  // Determine optional columns presence (like hop section logic)
  const hasPressure = useMemo(
    () =>
      steps.some(
        (s) => s.stage === "keg-conditioning" || s.stage === "spunding"
      ),
    [steps]
  );
  const hasDryHopToggle = !!showDryHopColumn;

  const gridCols = useMemo(() => {
    // Stage | Temp | Days | [Pressure?] | [Dry Hop?] | Notes | Remove
    if (hasPressure && hasDryHopToggle) {
      return "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.7fr)_minmax(0,.25fr)_minmax(0,1.5fr)_min-content]";
    }
    if (hasPressure && !hasDryHopToggle) {
      return "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.7fr)_minmax(0,1.5fr)_min-content]";
    }
    if (!hasPressure && hasDryHopToggle) {
      return "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.25fr)_minmax(0,1.5fr)_min-content]";
    }
    return "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_min-content]";
  }, [hasPressure, hasDryHopToggle]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addStep = (partial?: Partial<FermentationStep>) => {
    const next: FermentationStep = {
      id: crypto.randomUUID(),
      stage: "primary",
      tempC: 20,
      days: 7,
      ...partial,
    };
    onChange([...steps, next]);
  };

  const removeStep = (id: string) => onChange(steps.filter((s) => s.id !== id));

  const setStep = (idx: number, updated: Partial<FermentationStep>) => {
    const copy = [...steps];
    copy[idx] = { ...copy[idx], ...updated };
    onChange(copy);
  };

  const loadAlePreset = () => {
    const preset: FermentationStep[] = [
      {
        id: crypto.randomUUID(),
        stage: "primary",
        tempC: 19,
        days: 7,
      },
      {
        id: crypto.randomUUID(),
        stage: "conditioning",
        tempC: 19,
        days: 6,
      },
      {
        id: crypto.randomUUID(),
        stage: "cold-crash",
        tempC: 2,
        days: 2,
      },
      {
        id: crypto.randomUUID(),
        stage: "keg-conditioning",
        tempC: 2,
        days: 7,
        pressurePsi: 12,
      },
    ];
    onChange(preset);
  };

  const loadLagerPreset = () => {
    const preset: FermentationStep[] = [
      {
        id: crypto.randomUUID(),
        stage: "primary",
        tempC: 10,
        days: 10,
      },
      {
        id: crypto.randomUUID(),
        stage: "diacetyl-rest",
        tempC: 18,
        days: 2,
      },
      {
        id: crypto.randomUUID(),
        stage: "cold-crash",
        tempC: 2,
        days: 2,
      },
      {
        id: crypto.randomUUID(),
        stage: "lagering",
        tempC: 2,
        days: 21,
      },
    ];
    onChange(preset);
  };

  return (
    <div className="space-y-3">
      {/* spring keyframes for textarea scale overshoot */}
      <style>{`@keyframes springy{0%{transform:scaleY(0.96) scaleX(1.02) rotate(-0.2deg)}60%{transform:scaleY(1.04) scaleX(0.98) rotate(0.2deg)}100%{transform:scaleY(1) scaleX(1) rotate(0deg)}}`}</style>{" "}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text-primary-strong">
          Fermentation Plan
        </div>
        <div className="flex items-center gap-2">
          <button
            className="hidden sm:block btn-neon"
            onClick={() => addStep()}
          >
            + Add Step
          </button>
          <div className="inline-flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-xs text-white/40 hover:bg-white/20 shadow-lg shadow-black/30 hover:shadow-sm"
              onClick={loadAlePreset}
            >
              Preset: Ale
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-xs text-white/40 hover:bg-white/20 shadow-lg shadow-black/30 hover:shadow-sm"
              onClick={loadLagerPreset}
            >
              Preset: Lager
            </button>
          </div>
        </div>
      </div>
      <div className={"hidden sm:grid gap-2 text-xs text-muted " + gridCols}>
        <div>Stage</div>
        <div>Temp</div>
        <div>Days</div>
        {hasPressure && <div className="text-center">Pressure</div>}
        {hasDryHopToggle && (
          <div className="text-start -translate-x-5">Dry Hop?</div>
        )}
        <div>Notes</div>
        <div></div>
      </div>
      <DndContext
        sensors={sensors}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldIndex = steps.findIndex((x) => x.id === String(active.id));
          const newIndex = steps.findIndex((x) => x.id === String(over.id));
          if (oldIndex < 0 || newIndex < 0) return;
          const next = arrayMove(steps, oldIndex, newIndex);
          onChange(next);
        }}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {steps.map((s, i) => (
            <FermentationRow
              key={s.id}
              s={s}
              i={i}
              gridCols={gridCols}
              hasPressure={hasPressure}
              hasDryHopToggle={hasDryHopToggle}
              setStep={setStep}
              removeStep={removeStep}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="flex items-center justify-between">
        <button
          className="block sm:hidden w-full btn-neon"
          onClick={() => addStep()}
        >
          + Add Step
        </button>
        <div className="text-sm text-white/70">
          Total: {totalDays.toFixed(1)} days
        </div>
      </div>
    </div>
  );
}

function FermentationRow({
  s,
  i,
  gridCols,
  hasPressure,
  hasDryHopToggle,
  setStep,
  removeStep,
}: {
  s: FermentationStep;
  i: number;
  gridCols: string;
  hasPressure: boolean;
  hasDryHopToggle: boolean;
  setStep: (idx: number, updated: Partial<FermentationStep>) => void;
  removeStep: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: s.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  } as CSSProperties;
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    const maxPx = Math.round(window.innerHeight * 0.75);
    el.style.height = Math.min(el.scrollHeight, maxPx) + "px";
    // detect overflow
    const hasText = (el.value?.trim().length ?? 0) > 0;
    // Compare against collapsed max height (Tailwind max-h-10 = 2.5rem)
    const rootFontPx = parseFloat(
      getComputedStyle(document.documentElement).fontSize || "16"
    );
    const collapsedMaxPx = Math.round(
      (Number.isFinite(rootFontPx) ? rootFontPx : 16) * 2.5
    );
    const overflow = hasText && el.scrollHeight > collapsedMaxPx + 2;
    setIsOverflowing(overflow);
  };
  const scheduleResize = () => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() =>
      autoResize(notesRef.current)
    );
  };
  useEffect(() => {
    autoResize(notesRef.current);
  }, [s.notes]);
  useEffect(() => {
    const onResize = () => autoResize(notesRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(
    () => () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    },
    []
  );
  return (
    <div
      className={"grid grid-cols-1 " + gridCols + " gap-2"}
      style={style}
      ref={setNodeRef}
    >
      <label className="flex flex-col">
        <div className="text-xs text-muted mb-1 sm:hidden">Stage</div>
        <select
          className="w-full rounded-md border px-2 py-2.5"
          value={s.stage}
          onChange={(e) =>
            setStep(i, {
              stage: e.target.value as FermentationStep["stage"],
            })
          }
        >
          {(
            [
              "primary",
              "secondary",
              "diacetyl-rest",
              "conditioning",
              "cold-crash",
              "lagering",
              "keg-conditioning",
              "bottle-conditioning",
              "spunding",
            ] as const
          ).map((st) => (
            <option key={st} value={st}>
              {STAGE_LABEL[st]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col">
        <div className="text-xs text-muted mb-1 sm:hidden">Temp</div>
        <InputWithSuffix
          value={s.tempC}
          onChange={(n) => setStep(i, { tempC: n })}
          step={0.5}
          suffix="°C"
          suffixClassName="right-3 text-[10px]"
        />
      </label>
      <label className="flex flex-col">
        <div className="text-xs text-muted mb-1 sm:hidden">Days</div>
        <InputWithSuffix
          value={s.days}
          onChange={(n) => setStep(i, { days: n })}
          step={0.5}
          suffix=" days"
          suffixClassName="right-3 text-[10px]"
        />
      </label>
      {hasPressure ? (
        s.stage === "keg-conditioning" || s.stage === "spunding" ? (
          <label className="flex flex-col">
            <div className="text-xs text-muted mb-1 sm:hidden">Pressure</div>
            <InlineEditableNumber
              value={s.pressurePsi ?? 0}
              onChange={(n) =>
                setStep(i, { pressurePsi: n > 0 ? n : undefined })
              }
              step={0.5}
              suffix="psi"
              suffixClassName="left-9 right-0.5 text-[10px]"
              placeholder="0"
            />
          </label>
        ) : (
          <div className="hidden sm:block" />
        )
      ) : null}
      {hasDryHopToggle ? (
        s.stage === "primary" ||
        s.stage === "secondary" ||
        s.stage === "conditioning" ? (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              aria-label="Dry Hop?"
              className="h-4 w-4"
              checked={Boolean(s.dryHopReminder)}
              onChange={(e) => setStep(i, { dryHopReminder: e.target.checked })}
            />
          </div>
        ) : (
          <div className="hidden sm:block" />
        )
      ) : null}
      <label className="flex flex-col group relative">
        <div className="text-xs text-muted mb-1 sm:hidden">Notes</div>
        <textarea
          ref={notesRef}
          rows={1}
          className={
            "w-full rounded-md border px-3 py-2 resize-none min-h-[2.5rem] overflow-hidden max-h-10 transition-[max-height] duration-120 ease-[cubic-bezier(0.31,1.46,0.62,1)] will-change-[max-height] [transform-origin:top]" +
            (isOverflowing
              ? " group-hover:overflow-auto focus:overflow-auto group-hover:max-h-[75vh] focus:max-h-[75vh] group-hover:duration-[320ms] group-focus-within:duration-[360ms] group-hover:animate-[springy_255ms_cubic-bezier(0.34,1.56,0.64,1)_both] group-focus-within:animate-[springy_255ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
              : "")
          }
          placeholder="Optional notes"
          value={s.notes ?? ""}
          onFocus={(e) => autoResize(e.currentTarget)}
          onChange={(e) => {
            setStep(i, { notes: e.target.value });
            autoResize(e.currentTarget);
            scheduleResize();
          }}
          onInput={() => scheduleResize()}
          onKeyUp={() => scheduleResize()}
          onBlur={() => {
            scheduleResize();
            window.setTimeout(scheduleResize, 160);
          }}
          onMouseEnter={() => scheduleResize()}
          onMouseLeave={() => {
            scheduleResize();
            window.setTimeout(scheduleResize, 160);
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName.includes("max-height")) scheduleResize();
          }}
        />
        {isOverflowing ? (
          <div className="pointer-events-none absolute inset-x-1 bottom-1 h-4 bg-gradient-to-t from-black/35 to-transparent rounded-sm flex justify-end items-end pr-1 text-[18px] text-white/50 opacity-100 group-hover:opacity-0 group-focus-within:opacity-0 transition-opacity">
            …
          </div>
        ) : null}
      </label>
      <div className="flex justify-end items-center gap-1">
        <button
          type="button"
          aria-label="Drag"
          className="p-1 cursor-grab text-neutral-400 hover:text-white"
          {...attributes}
          {...listeners}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
          </svg>
        </button>
        <button
          className="p-1 text-neutral-400 hover:text-red-500 transition w-fit"
          onClick={() => removeStep(s.id)}
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
  );
}
