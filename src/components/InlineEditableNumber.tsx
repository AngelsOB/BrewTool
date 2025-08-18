import InputWithSuffix from "./InputWithSuffix";

type Props = {
  value: number | undefined;
  onChange: (next: number) => void;
  suffix: string;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  suffixClassName?: string;
};

/**
 * Displays a number + suffix in a bordered box; turns into a number input on hover or focus.
 */
export default function InlineEditableNumber({
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
    <div className={`relative group ${className ?? ""}`}>
      {/* Display mode */}
      <div className="rounded-md border px-3 py-2 w-full select-none group-hover:hidden group-focus-within:hidden">
        <div className="relative">
          <span>
            {Number.isFinite(value as number) ? (value as number) : 0}
          </span>
          <span
            className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500 ${
              suffixClassName ?? "text-[10px]"
            }`}
          >
            {suffix}
          </span>
        </div>
      </div>

      {/* Edit mode (hover/focus) */}
      <div className="hidden group-hover:block group-focus-within:block">
        <InputWithSuffix
          value={value}
          onChange={onChange}
          suffix={suffix}
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          suffixClassName={suffixClassName}
        />
      </div>
    </div>
  );
}
