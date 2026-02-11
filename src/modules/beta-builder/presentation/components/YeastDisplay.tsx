/**
 * Yeast Display Component
 *
 * Displays selected yeast information with laboratory branding,
 * inline attenuation editing, and change button.
 */

import YeastLabBadge from "./YeastLabBadge";
import type { Yeast } from "../../domain/models/Recipe";

interface YeastDisplayProps {
  /** The currently selected yeast */
  yeast: Yeast;
  /** Callback when user wants to change yeast */
  onChangeYeast: () => void;
  /** Callback when attenuation is updated */
  onUpdateAttenuation: (attenuation: number) => void;
}

export default function YeastDisplay({
  yeast,
  onChangeYeast,
  onUpdateAttenuation,
}: YeastDisplayProps) {
  return (
    <div className="brew-ingredient-row">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Name and Laboratory */}
        <div className="col-span-6 flex items-start gap-4">
          <div className="mt-1">
            <YeastLabBadge laboratory={yeast.laboratory} size="md" />
          </div>
          <div>
            <span className="font-medium text-lg block" style={{ color: 'var(--fg-strong)' }}>{yeast.name}</span>
            {yeast.laboratory && (
              <div className="text-sm font-medium text-muted">
                {yeast.laboratory}
              </div>
            )}
          </div>
        </div>

        {/* Attenuation */}
        <div className="col-span-5">
          <label htmlFor="yeast-attenuation" className="text-xs font-semibold block mb-1">
            Attenuation
          </label>
          <div className="flex items-center gap-2">
            <input
              id="yeast-attenuation"
              type="number"
              value={(yeast.attenuation * 100).toFixed(0)}
              onChange={(e) =>
                onUpdateAttenuation((parseFloat(e.target.value) || 0) / 100)
              }
              className="brew-input w-24"
              step="1"
              min="0"
              max="100"
            />
            <span className="text-sm font-medium">%</span>
          </div>
        </div>

        {/* Change Button */}
        <div className="col-span-1 text-right">
          <button
            onClick={onChangeYeast}
            className="brew-link text-sm font-medium"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
