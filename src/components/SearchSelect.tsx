import { useEffect, useMemo, useRef, useState } from "react";

export type SearchOption = { label: string; value: string };
export type SearchGroup = { label: string; options: SearchOption[] };

export default function SearchSelect({
  value,
  onChange,
  options,
  groups,
  placeholder,
  className,
  onCreate,
  formatSelectedLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  options?: SearchOption[];
  groups?: SearchGroup[];
  placeholder?: string;
  className?: string;
  onCreate?: (query: string) => void;
  formatSelectedLabel?: (value: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const display = useMemo(() => {
    const q = (query || value || "").toLowerCase();
    const stripDiacritics = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalize = (s: string) =>
      stripDiacritics(s.toLowerCase()).replace(/[^a-z0-9]/gi, "");
    const tokens = q
      .split(/\s+/)
      .map((t) => normalize(t))
      .filter((t) => t.length > 0);
    const matchesFuzzy = (label: string) => {
      if (tokens.length === 0) return true;
      const norm = normalize(label);
      return tokens.every((t) => norm.includes(t));
    };
    if (groups && groups.length) {
      const filtered: SearchGroup[] = groups.map((g) => ({
        label: g.label,
        options: q ? g.options.filter((o) => matchesFuzzy(o.label)) : g.options,
      }));
      // Flatten with headers for keyboard nav
      type FlatItem = { label: string; value: string; header?: boolean };
      const flat: FlatItem[] = [];
      for (const g of filtered) {
        if (g.options.length === 0) continue;
        flat.push({
          label: g.label,
          value: `__header__:${g.label}`,
          header: true,
        });
        for (const o of g.options) flat.push(o);
      }
      return { filteredGroups: filtered, flat };
    }
    const opts = options || [];
    const filtered: Array<{ label: string; value: string }> = q
      ? opts.filter((o) => matchesFuzzy(o.label))
      : opts;
    return {
      filteredGroups: undefined,
      flat: filtered as Array<{
        label: string;
        value: string;
        header?: boolean;
      }>,
    };
  }, [groups, options, query, value]);

  const hasSelectable = useMemo(
    () => display.flat.some((x) => !(x as { header?: boolean }).header),
    [display.flat]
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        className={`w-full rounded-md border px-3 py-2 text-sm sm:text-base ${
          className || ""
        }`}
        placeholder={placeholder || "Type to search"}
        value={
          open
            ? value
            : formatSelectedLabel
            ? formatSelectedLabel(value)
            : value
        }
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(display.flat.length - 1, h + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(0, h - 1));
          } else if (e.key === "Enter") {
            if (open && display.flat[highlight]) {
              e.preventDefault();
              const item = display.flat[highlight];
              const isHeader = (item as { header?: boolean }).header;
              if (!isHeader) {
                onChange(item.value);
                setOpen(false);
              } else if (!hasSelectable && onCreate) {
                onCreate(query);
                setOpen(false);
              }
            } else if (open && !hasSelectable && onCreate) {
              e.preventDefault();
              onCreate(query);
              setOpen(false);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:bg-black/50 backdrop-blur shadow-lg max-h-80 overflow-auto text-sm sm:text-base">
          {hasSelectable ? (
            display.filteredGroups ? (
              <div>
                {display.filteredGroups.map((g, gi) =>
                  g.options.length ? (
                    <div key={g.label + gi}>
                      <div className="px-3 py-1 text-xs uppercase tracking-wide text-muted sticky top-0 bg-[rgb(var(--surface))] dark:bg-black/50 backdrop-blur-sm">
                        {g.label}
                      </div>
                      {g.options.map((o, idx) => {
                        const flatIndex = display.flat.findIndex(
                          (x) => !x.header && x.value === o.value
                        );
                        const active = flatIndex === highlight;
                        return (
                          <button
                            key={o.value + gi + idx}
                            type="button"
                            className={`block w-full text-left px-3 py-2 hover:bg-[rgb(var(--border))]/50 ${
                              active ? "bg-[rgb(var(--border))]/30" : ""
                            }`}
                            onMouseEnter={() => setHighlight(flatIndex)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onChange(o.value);
                              setOpen(false);
                            }}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div>
                {display.flat.map((o, idx) => (
                  <button
                    key={o.value + idx}
                    type="button"
                    className={`block w-full text-left px-3 py-2 hover:bg-[rgb(var(--border))]/50 ${
                      idx === highlight ? "bg-[rgb(var(--border))]/30" : ""
                    }`}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div>
              {display.flat.map((o, idx) => (
                <button
                  key={o.value + idx}
                  type="button"
                  className={`block w-full text-left px-3 py-2 hover:bg-[rgb(var(--border))]/50 ${
                    idx === highlight ? "bg-[rgb(var(--border))]/30" : ""
                  }`}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
          {!hasSelectable && onCreate ? (
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-[rgb(var(--border))]/50"
              onMouseDown={(e) => {
                e.preventDefault();
                onCreate(query);
                setOpen(false);
              }}
            >
              Add new: "{query.trim()}" ?
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
