/**
 * Salt Summary Component
 *
 * Collapsed view showing salt additions with auto-calculated
 * mash/sparge split amounts.
 */

import type { SaltAdditions } from "../../../domain/services/WaterChemistryService";
import { SALT_SHORT_LABELS } from "./constants";

type Props = {
  /** Total salt additions configured for the recipe */
  saltAdditions: Partial<SaltAdditions>;
  /** Salt amounts for mash water (auto-calculated) */
  mashSalts: Partial<SaltAdditions>;
  /** Salt amounts for sparge water (auto-calculated) */
  spargeSalts: Partial<SaltAdditions>;
  /** Name of the source water profile */
  sourceProfileName?: string;
};

export default function SaltSummary({
  saltAdditions,
  mashSalts,
  spargeSalts,
  sourceProfileName,
}: Props) {
  const hasSalts = Object.values(saltAdditions).some((v) => v && v > 0);

  return (
    <div>
      {hasSalts && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Added to {sourceProfileName || "Custom"}:
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.keys(SALT_SHORT_LABELS) as Array<keyof SaltAdditions>).map(
          (saltKey) => {
            const totalAmount = saltAdditions[saltKey] || 0;
            const mashAmount = mashSalts[saltKey] || 0;
            const spargeAmount = spargeSalts[saltKey] || 0;

            if (totalAmount === 0) return null;

            return (
              <div
                key={saltKey}
                className="bg-cyan-50 dark:bg-cyan-900/30 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800"
              >
                <div className="text-xs text-cyan-700 dark:text-cyan-300 mb-1 font-medium">
                  {SALT_SHORT_LABELS[saltKey]}
                </div>
                <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                  {totalAmount.toFixed(1)}
                  <span className="text-sm ml-1">g total</span>
                </div>
                <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1 space-y-0.5">
                  <div>Mash: {mashAmount.toFixed(1)}g</div>
                  <div>Sparge: {spargeAmount.toFixed(1)}g</div>
                </div>
              </div>
            );
          }
        )}
        {!hasSalts && (
          <div className="col-span-full text-sm text-gray-500 dark:text-gray-400 italic">
            No salts added yet
          </div>
        )}
      </div>
    </div>
  );
}
