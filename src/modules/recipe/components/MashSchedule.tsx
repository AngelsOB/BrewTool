import InputWithSuffix from "../../../components/InputWithSuffix";
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

type MashStep = {
  id: string;
  type: "infusion" | "decoction" | "ramp";
  tempC: number;
  timeMin: number;
  decoctionPercent?: number;
};

export default function MashSchedule({
  steps,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}: {
  steps: MashStep[];
  onAdd: () => void;
  onUpdate: (index: number, next: MashStep) => void;
  onRemove: (id: string) => void;
  onReorder: (next: MashStep[]) => void;
}) {
  const hasDecoctionStep = steps.some((s) => s.type === "decoction");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <section className="section-soft space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="font-semibold text-primary-strong">Mash Schedule</div>
        <button className="hidden sm:block btn-neon" onClick={onAdd}>
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
        <DndContext
          sensors={sensors}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            const oldIndex = steps.findIndex((x) => x.id === String(active.id));
            const newIndex = steps.findIndex((x) => x.id === String(over.id));
            if (oldIndex < 0 || newIndex < 0) return;
            const next = arrayMove(steps, oldIndex, newIndex);
            onReorder(next);
          }}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((s, i) => (
              <MashStepRow
                key={s.id}
                step={s}
                index={i}
                hasDecoctionStep={hasDecoctionStep}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button className="block sm:hidden w-full btn-neon" onClick={onAdd}>
          + Add Step
        </button>
      </div>
    </section>
  );
}

function MashStepRow({
  step,
  index,
  hasDecoctionStep,
  onUpdate,
  onRemove,
}: {
  step: MashStep;
  index: number;
  hasDecoctionStep: boolean;
  onUpdate: (index: number, next: MashStep) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  } as CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
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
          value={step.type}
          onChange={(e) =>
            onUpdate(index, {
              ...step,
              type: e.target.value as MashStep["type"],
            })
          }
        >
          <option value="infusion">Infusion</option>
          <option value="ramp">Ramp</option>
          <option value="decoction">Decoction</option>
        </select>
      </label>
      <label className="block">
        <div className="text-xs text-muted mb-1 sm:hidden">Temp</div>
        <InputWithSuffix
          value={step.tempC}
          onChange={(n) => onUpdate(index, { ...step, tempC: n })}
          step={0.5}
          suffix="°C"
          suffixClassName="right-3 text-[10px]"
        />
      </label>
      <label className="block">
        <div className="text-xs text-muted mb-1 sm:hidden">Time</div>
        <InputWithSuffix
          value={step.timeMin}
          onChange={(n) => onUpdate(index, { ...step, timeMin: n })}
          step={1}
          suffix=" min"
          suffixClassName="right-3 text-[10px]"
        />
      </label>
      {hasDecoctionStep &&
        (step.type === "decoction" ? (
          <label className="block sm:col-span-1">
            <div className="text-xs text-muted mb-1 sm:hidden">Boil %</div>
            <InputWithSuffix
              value={step.decoctionPercent ?? 20}
              onChange={(n) =>
                onUpdate(index, { ...step, decoctionPercent: n })
              }
              step={1}
              suffix="%"
              suffixClassName="right-3 text-[10px]"
            />
          </label>
        ) : (
          <div className="hidden sm:block" />
        ))}
      <div className="flex justify-end items-center gap-1">
        <button
          type="button"
          aria-label="Drag"
          className="p-2 cursor-grab text-neutral-400 hover:text-white"
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
          className="p-2 text-neutral-400 hover:text-red-500"
          onClick={() => onRemove(step.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
