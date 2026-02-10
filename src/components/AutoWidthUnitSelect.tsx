import { useEffect, useLayoutEffect, useRef } from "react";

export default function AutoWidthUnitSelect({
  value,
  options,
  onChange,
  className,
  minPx = 40,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  className?: string;
  minPx?: number;
}) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  const updateWidth = () => {
    const span = measureRef.current;
    const sel = selectRef.current;
    if (!span || !sel) return;
    span.textContent = value || "";
    const width = Math.ceil(span.getBoundingClientRect().width) + 32; // +px padding
    sel.style.width = `${Math.max(minPx, width)}px`;
  };

  useLayoutEffect(() => {
    updateWidth();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateWidth is stable, runs when value changes
  }, [value]);

  useEffect(() => {
    const onResize = () => updateWidth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  return (
    <div className="relative inline-block align-middle">
      <span
        ref={measureRef}
        className="absolute invisible -z-10 whitespace-pre px-2 py-2.5"
      />
      <select
        ref={selectRef}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}
