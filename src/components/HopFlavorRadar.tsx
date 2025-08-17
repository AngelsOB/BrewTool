import type { HopFlavorProfile } from "../utils/presets";
import { HOP_FLAVOR_KEYS } from "../utils/presets";

type Series = { name: string; flavor: HopFlavorProfile };

type Props = {
  series: Series[]; // any length
  maxValue?: number; // default 5
  size?: number; // px, default 320
  title?: string;
  emptyHint?: string;
};

// Generate distinct colors per series index
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function colorForIndex(index: number, total: number): string {
  const hue = Math.round((360 * index) / Math.max(total, 6));
  return hslToHex(hue, 70, 50);
}

export default function HopFlavorRadar({
  series,
  maxValue = 5,
  size = 320,
  title,
  emptyHint,
}: Props) {
  const radius = size / 2 - 30;
  const center = { x: size / 2, y: size / 2 };
  const axes = HOP_FLAVOR_KEYS.length;

  function pointFor(idx: number, value: number) {
    const angle = (Math.PI * 2 * idx) / axes - Math.PI / 2; // start at top
    const r = (value / maxValue) * radius;
    const x = center.x + r * Math.cos(angle);
    const y = center.y + r * Math.sin(angle);
    return `${x},${y}`;
  }

  function ringPath(multiplier: number) {
    const pts = HOP_FLAVOR_KEYS.map((_, i) => {
      const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const r = radius * multiplier;
      const x = center.x + r * Math.cos(angle);
      const y = center.y + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
    return pts;
  }

  const rings = [0.2, 0.4, 0.6, 0.8, 1];
  const list = series;

  const isAllZero =
    series.length === 0 ||
    series.every((s) => HOP_FLAVOR_KEYS.every((k) => (s.flavor[k] || 0) === 0));

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <div className="text-center text-sm font-medium text-neutral-700">
          {title}
        </div>
      )}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        {/* Rings */}
        {rings.map((m, i) => (
          <polygon
            key={i}
            points={ringPath(m)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}
        {/* Axes */}
        {HOP_FLAVOR_KEYS.map((key, i) => {
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          const x = center.x + radius * Math.cos(angle);
          const y = center.y + radius * Math.sin(angle);
          return (
            <line
              key={key}
              x1={center.x}
              y1={center.y}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          );
        })}
        {/* Labels */}
        {HOP_FLAVOR_KEYS.map((key, i) => {
          const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
          const x = center.x + (radius + 14) * Math.cos(angle);
          const y = center.y + (radius + 14) * Math.sin(angle);
          const textAnchor =
            Math.cos(angle) > 0.2
              ? "start"
              : Math.cos(angle) < -0.2
              ? "end"
              : "middle";
          const dy =
            Math.sin(angle) > 0.6 ? 8 : Math.sin(angle) < -0.6 ? -2 : 4;
          const label = key
            .replace("resinPine", "Resin / Pine")
            .replace("tropicalFruit", "Tropical Fruit")
            .replace("stoneFruit", "Stone Fruit")
            .replace("citrus", "Citrus")
            .replace("berry", "Berry")
            .replace("floral", "Floral")
            .replace("grassy", "Grassy")
            .replace("herbal", "Herbal")
            .replace("spice", "Spice");
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="fill-neutral-600 text-[11px]"
              dy={dy}
            >
              {label}
            </text>
          );
        })}
        {/* Series Polygons */}
        {list.map((s, si) => {
          const pts = HOP_FLAVOR_KEYS.map((k, i) =>
            pointFor(i, s.flavor[k] || 0)
          ).join(" ");
          const color = colorForIndex(si, list.length);
          return (
            <g key={s.name}>
              <polygon
                points={pts}
                fill={color + "33"}
                stroke={color}
                strokeWidth={2}
              />
            </g>
          );
        })}
        {isAllZero && (
          <text
            x={center.x}
            y={center.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-neutral-400 text-xs"
          >
            {emptyHint || "No data"}
          </text>
        )}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        {list.map((s, i) => (
          <div
            key={s.name}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/60 px-2 py-1"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: colorForIndex(i, list.length) }}
            />
            <span className="font-medium text-neutral-800">{s.name}</span>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-neutral-500">
        0-5 scale. 0s mean no aroma values available.
      </div>
    </div>
  );
}
