type Props = {
  value: number | undefined;
  onChange: (next: number) => void;
  suffix: string; // e.g. " g", " %", "°C", " min", " days"
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  suffixClassName?: string; // optional override for position/size
};

export default function InputWithSuffix({
  value,
  onChange,
  suffix,
  step,
  min,
  max,
  placeholder,
  className,
  suffixClassName,
}: Props) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        className="rounded-md border px-3 py-2 pr-6 w-full sm:text-right text-left"
        type="number"
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        value={Number.isFinite(value as number) ? (value as number) : 0}
        onChange={(e) => {
          const n = e.currentTarget.valueAsNumber;
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
      <span
        className={
          `pointer-events-none absolute inset-y-0 z-10 flex items-center text-neutral-500 ` +
          (suffixClassName ?? "right-8 text-xs")
        }
      >
        {suffix}
      </span>
    </div>
  );
}
