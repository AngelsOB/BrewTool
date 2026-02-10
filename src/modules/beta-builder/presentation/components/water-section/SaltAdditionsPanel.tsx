/**
 * Salt Additions Panel Component
 *
 * Input controls for adjusting total salt additions.
 * Shows the auto-calculated mash/sparge split for each salt.
 */

import type { SaltAdditions } from "../../../domain/services/WaterChemistryService";
import { SALT_LABELS } from "./constants";

type Props = {
  /** Current total salt additions */
  saltAdditions: Partial<SaltAdditions>;
  /** Salt amounts for mash water (auto-calculated) */
  mashSalts: Partial<SaltAdditions>;
  /** Salt amounts for sparge water (auto-calculated) */
  spargeSalts: Partial<SaltAdditions>;
  /** Callback when a salt amount changes */
  onSaltChange: (saltKey: keyof SaltAdditions, value: number) => void;
};

export default function SaltAdditionsPanel({
  saltAdditions,
  mashSalts,
  spargeSalts,
  onSaltChange,
}: Props) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">Salt Additions (grams total)</h4>
      <p className="text-xs text-muted mb-3">
        Enter total amounts - they'll be automatically split between mash and sparge
        water
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(SALT_LABELS) as Array<keyof SaltAdditions>).map((saltKey) => {
          const totalAmount = saltAdditions[saltKey] || 0;
          const mashAmount = mashSalts[saltKey] || 0;
          const spargeAmount = spargeSalts[saltKey] || 0;

          return (
            <div key={saltKey}>
              <label className="block text-xs mb-1 text-muted">
                {SALT_LABELS[saltKey]}
              </label>
              <input
                type="number"
                value={totalAmount || ""}
                onChange={(e) =>
                  onSaltChange(saltKey, parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                step="0.1"
                min="0"
                className="brew-input w-full"
              />
              {totalAmount > 0 && (
                <div className="text-xs text-muted mt-1">
                  Mash: {mashAmount.toFixed(1)}g / Sparge: {spargeAmount.toFixed(1)}g
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
