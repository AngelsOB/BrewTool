/**
 * Water Profile Comparison Component
 *
 * Displays a table comparing source, target, and final water ion profiles.
 * Uses color-coded indicators to show how close the final profile is to target.
 */

import type { WaterProfile } from "../../../domain/services/WaterChemistryService";
import { ION_LABELS } from "./constants";

type Props = {
  /** The source water profile */
  sourceProfile: WaterProfile;
  /** The target style profile */
  targetProfile: WaterProfile;
  /** The calculated final profile after salt additions */
  finalProfile: WaterProfile;
};

export default function WaterProfileComparison({
  sourceProfile,
  targetProfile,
  finalProfile,
}: Props) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">Water Profile Comparison (ppm)</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))]">
              <th className="text-left py-2 px-3 font-semibold">Ion</th>
              <th className="text-right py-2 px-3 font-semibold">Source</th>
              <th className="text-right py-2 px-3 font-semibold">Target</th>
              <th className="text-right py-2 px-3 font-semibold">Final</th>
            </tr>
          </thead>
          <tbody>
            {ION_LABELS.map((ion) => {
              const finalValue = Math.round(finalProfile[ion]);
              const targetValue = Math.round(targetProfile[ion]);

              // Calculate difference from target and create opacity-based gradient
              const diff = finalValue - targetValue;
              const tolerance = targetValue * 0.2;

              // Calculate how far off we are as a percentage (0 = on target, 1 = very far)
              let deviationPercent = 0;
              let baseColor = "green"; // Default to green

              if (diff < -tolerance) {
                // Too low - red
                baseColor = "red";
                deviationPercent = Math.min(Math.abs(diff) / (targetValue || 1), 1);
              } else if (diff > tolerance) {
                // Too high - orange
                baseColor = "orange";
                deviationPercent = Math.min(diff / (targetValue || 1), 1);
              } else {
                // Within tolerance - calculate proximity to exact target
                // Closer to exact = higher deviationPercent for darker green
                const absoluteDiff = Math.abs(diff);
                const percentOfTolerance = absoluteDiff / tolerance; // 0 = exact, 1 = at edge
                deviationPercent = 1 - percentOfTolerance; // Invert: 1 = exact, 0 = at edge
              }

              // Map deviation to opacity
              // For green: exact target (1.0) = 0.6 opacity, edge (0.0) = 0.15 opacity
              // For red/orange: further from target = higher opacity
              const opacity =
                baseColor === "green"
                  ? 0.15 + deviationPercent * 0.45 // Scales from 0.15 to 0.6
                  : Math.max(0.15, Math.min(0.6, deviationPercent));

              const bgStyle = {
                backgroundColor:
                  baseColor === "green"
                    ? `rgba(34, 197, 94, ${opacity})` // green-500
                    : baseColor === "red"
                      ? `rgba(239, 68, 68, ${opacity})` // red-500
                      : `rgba(249, 115, 22, ${opacity})`, // orange-500
              };

              return (
                <tr key={ion} className="border-b border-[rgb(var(--border))]">
                  <td className="py-2 px-3 font-medium">{ion}</td>
                  <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                    {Math.round(sourceProfile[ion])}
                  </td>
                  <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">
                    {targetValue}
                  </td>
                  <td className="text-right py-2 px-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded font-bold"
                      style={bgStyle}
                    >
                      {finalValue}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
