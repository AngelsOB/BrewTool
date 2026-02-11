/**
 * ArcGauge - Semi-circular SVG gauge for BJCP style range visualization.
 *
 * Renders a 180-degree arc (bowing upward like a speedometer) with colored
 * zones (red/green/red for standard metrics, beer-color gradient for SRM)
 * and a needle indicating the current recipe value.
 *
 * SVG coordinate system notes:
 * - The arc sweeps from left to right across the top half.
 * - Center/pivot is at the bottom-center of the semicircle.
 * - Angles: 0 = right (3 o'clock), PI = left (9 o'clock).
 * - In SVG, y increases downward, so we use cy - r*sin(a) to go UP.
 * - The arc bows upward because the center is placed near the bottom
 *   of the viewBox, and the arc extends above it.
 */

import { srmToRgb } from "../../utils/srmColorUtils";

interface ArcGaugeProps {
  label: string;
  value: number;
  range?: [number, number];
  format?: (n: number) => string;
  maxFallback?: number;
  isSrm?: boolean;
}

// --- Geometry constants ---
const VIEWBOX_W = 230;
const VIEWBOX_H = 135;
const CX = 115;        // horizontal center
const CY = 115;        // pivot point near the bottom — arc extends upward
const RADIUS = 82;
const TRACK_WIDTH = 14;
const NEEDLE_LEN = RADIUS - 8;
const PAD_FACTOR = 0.15;

// --- Helpers ---

/**
 * Map a value within [domMin, domMax] to an angle in radians.
 * domMin -> PI (left), domMax -> 0 (right).
 */
function valueToAngle(value: number, domMin: number, domMax: number): number {
  const t = Math.max(0, Math.min(1, (value - domMin) / (domMax - domMin)));
  return Math.PI * (1 - t);
}

/**
 * Convert polar (angle in radians) to SVG cartesian.
 * Angle 0 = right, PI = left. Arc goes ABOVE the center.
 * In SVG y-down coords: y = cy - r * sin(angle) to go upward.
 */
function pol(angle: number): { x: number; y: number } {
  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY - RADIUS * Math.sin(angle),
  };
}

function polR(r: number, angle: number): { x: number; y: number } {
  return {
    x: CX + r * Math.cos(angle),
    y: CY - r * Math.sin(angle),
  };
}

/**
 * SVG arc path from startAngle to endAngle.
 * We traverse from higher angle (left) to lower angle (right).
 * sweep-flag=1 draws clockwise in SVG (which traces the upper arc).
 */
function arcPath(startAngle: number, endAngle: number): string {
  // Ensure we go from higher angle to lower (left to right)
  const a1 = Math.max(startAngle, endAngle);
  const a2 = Math.min(startAngle, endAngle);
  const s = pol(a1);
  const e = pol(a2);
  const sweep = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
  return `M ${s.x} ${s.y} A ${RADIUS} ${RADIUS} 0 ${sweep} 1 ${e.x} ${e.y}`;
}

export default function ArcGauge({
  label,
  value,
  range,
  format = (n) => n.toString(),
  maxFallback,
  isSrm = false,
}: ArcGaugeProps) {
  // --- Domain ---
  const min = range?.[0] ?? 0;
  const max = range?.[1] ?? maxFallback ?? Math.max(min + 1, value * 1.5);
  const span = Math.max(0.0001, range ? max - min : Math.abs(value - min) || 0.0001);
  const pad = span * PAD_FACTOR;
  const domMin = range ? Math.min(min, value) - pad : value - pad;
  const domMax = range ? Math.max(max, value) + pad : value + pad;

  // Small epsilon for floating-point boundary comparisons
  const eps = span * 0.005;
  const inRange = range ? value >= min - eps && value <= max + eps : true;

  // --- Angles (radians) ---
  // domMin maps to PI (left), domMax maps to 0 (right)
  const minAngle = range ? valueToAngle(min, domMin, domMax) : Math.PI;
  const maxAngle = range ? valueToAngle(max, domMin, domMax) : 0;
  const valAngle = valueToAngle(value, domMin, domMax);

  // Needle rotation in degrees for CSS transform.
  // The needle starts pointing straight UP (12 o'clock = 0deg rotation).
  // We rotate it: left = -90deg, right = +90deg.
  // valAngle is in radians: PI=left, 0=right.
  // So rotation = 90 - valAngle_in_degrees = 90 - (valAngle * 180/PI)
  const needleDeg = 90 - (valAngle * 180) / Math.PI;

  // --- Needle geometry (pointing up, rotated via CSS) ---
  const tipY = CY - NEEDLE_LEN;
  const baseHalf = 3;

  // --- Tick marks ---
  function Tick({ angle, text }: { angle: number; text: string }) {
    const outerR = RADIUS + TRACK_WIDTH / 2;
    const tickR = outerR + 6;
    const labelR = tickR + 10;
    const p1 = polR(outerR, angle);
    const p2 = polR(tickR, angle);
    const pLabel = polR(labelR, angle);

    return (
      <g>
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke="var(--fg-muted)"
          strokeWidth={1.5}
          opacity={0.4}
        />
        <text
          x={pLabel.x}
          y={pLabel.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--fg-muted)"
          fontSize={9}
          fontWeight={600}
        >
          {text}
        </text>
      </g>
    );
  }

  // --- SRM segmented arc ---
  const NUM_SRM_SEGMENTS = 24;
  function SrmArc() {
    if (!range) return null;
    const segments = [];
    for (let i = 0; i < NUM_SRM_SEGMENTS; i++) {
      const segDomStart = domMin + ((domMax - domMin) * i) / NUM_SRM_SEGMENTS;
      const segDomEnd = domMin + ((domMax - domMin) * (i + 1)) / NUM_SRM_SEGMENTS;
      const segMid = (segDomStart + segDomEnd) / 2;
      const isInRange = segMid >= min && segMid <= max;
      const startA = valueToAngle(segDomStart, domMin, domMax);
      const endA = valueToAngle(segDomEnd, domMin, domMax);
      segments.push(
        <path
          key={i}
          d={arcPath(startA, endA)}
          stroke={srmToRgb(Math.max(1, segMid))}
          strokeWidth={TRACK_WIDTH}
          fill="none"
          opacity={isInRange ? 0.85 : 0.2}
          strokeLinecap="butt"
        />,
      );
    }
    return <>{segments}</>;
  }

  // Accessibility label
  const ariaLabel = range
    ? `${label}: ${format(value)}, BJCP range ${format(min)} to ${format(max)}, ${inRange ? "in range" : "out of range"}`
    : `${label}: ${format(value)}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={ariaLabel}
      >
        <title>{ariaLabel}</title>

        {/* Background track */}
        <path
          d={arcPath(Math.PI, 0)}
          stroke="rgb(var(--brew-card-inset))"
          strokeWidth={TRACK_WIDTH}
          fill="none"
          strokeLinecap="round"
        />

        {isSrm ? (
          <SrmArc />
        ) : (
          <>
            {/* Red zone: below min (left edge to min) */}
            {range && minAngle < Math.PI - 0.01 && (
              <path
                d={arcPath(Math.PI, minAngle)}
                stroke="var(--brew-danger)"
                strokeWidth={TRACK_WIDTH}
                fill="none"
                opacity={0.2}
                strokeLinecap="butt"
              />
            )}

            {/* Green zone: valid range (min to max) */}
            {range && (
              <path
                d={arcPath(minAngle, maxAngle)}
                stroke="var(--brew-success)"
                strokeWidth={TRACK_WIDTH}
                fill="none"
                opacity={0.3}
                strokeLinecap="butt"
              />
            )}

            {/* Red zone: above max (max to right edge) */}
            {range && maxAngle > 0.01 && (
              <path
                d={arcPath(maxAngle, 0)}
                stroke="var(--brew-danger)"
                strokeWidth={TRACK_WIDTH}
                fill="none"
                opacity={0.2}
                strokeLinecap="butt"
              />
            )}
          </>
        )}

        {/* Min/Max tick marks */}
        {range && (
          <>
            <Tick angle={minAngle} text={format(min)} />
            <Tick angle={maxAngle} text={format(max)} />
          </>
        )}

        {/* Needle (rotated group with CSS transition) */}
        <g
          className="brew-gauge-needle"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            transform: `rotate(${needleDeg}deg)`,
          }}
        >
          <polygon
            points={`${CX},${tipY} ${CX - baseHalf},${CY - 4} ${CX + baseHalf},${CY - 4}`}
            fill={inRange ? "var(--brew-accent-500)" : "var(--brew-danger)"}
          />
        </g>

        {/* Center hub */}
        <circle
          cx={CX}
          cy={CY}
          r={6}
          fill={inRange ? "var(--brew-accent-500)" : "var(--brew-danger)"}
        />
        <circle cx={CX} cy={CY} r={3} fill="rgb(var(--brew-card))" />

        {/* Value text (inside the arc) */}
        <text
          x={CX}
          y={CY - 28}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--fg-strong)"
          fontSize={20}
          fontWeight={900}
          style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
        >
          {format(value)}
        </text>

        {/* Label below the hub */}
        <text
          x={CX}
          y={CY + 16}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--fg-muted)"
          fontSize={10}
          fontWeight={700}
          letterSpacing="0.1em"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
