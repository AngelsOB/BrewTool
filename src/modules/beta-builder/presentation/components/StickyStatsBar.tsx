/**
 * StickyStatsBar - Compact sticky header/footer showing key recipe calculations.
 *
 * Used in BetaBuilderPage to display recipe stats that appear when scrolling
 * past the main calculated values section. Supports both top and bottom positioning.
 */

import { srmToRgb } from '../../utils/srmColorUtils';

export interface RecipeCalculations {
  abv: number;
  og: number;
  fg: number;
  ibu: number;
  srm: number;
  calories: number;
  carbsG: number;
}

interface StickyStatsBarProps {
  calculations: RecipeCalculations;
  position: 'top' | 'bottom';
  isVisible: boolean;
}

export default function StickyStatsBar({
  calculations,
  position,
  isVisible,
}: StickyStatsBarProps) {
  const positionClasses =
    position === 'top'
      ? 'top-0 border-b'
      : 'bottom-0 border-t';

  const translateClasses = isVisible
    ? 'translate-y-0 opacity-100'
    : position === 'top'
      ? '-translate-y-full opacity-0'
      : 'translate-y-full opacity-0';

  return (
    <div
      className={`fixed left-0 right-0 bg-[rgb(var(--brew-card))]/95 backdrop-blur-md border-[rgb(var(--brew-border))] shadow-lg z-40 transition-all duration-300 ease-in-out ${positionClasses} ${translateClasses}`}
    >
      <div className="max-w-4xl mx-auto px-8 py-2">
        <div className="grid grid-cols-7 gap-2">
          {/* ABV */}
          <div className="text-center">
            <div className="brew-gauge-label">ABV</div>
            <div className="brew-gauge-value text-lg">
              {calculations.abv.toFixed(1)}%
            </div>
          </div>

          {/* OG */}
          <div className="text-center">
            <div className="brew-gauge-label">OG</div>
            <div className="brew-gauge-value text-lg">
              {calculations.og.toFixed(3)}
            </div>
          </div>

          {/* FG */}
          <div className="text-center">
            <div className="brew-gauge-label">FG</div>
            <div className="brew-gauge-value text-lg">
              {calculations.fg.toFixed(3)}
            </div>
          </div>

          {/* IBU */}
          <div className="text-center">
            <div className="brew-gauge-label">IBU</div>
            <div className="brew-gauge-value text-lg">
              {calculations.ibu.toFixed(0)}
            </div>
          </div>

          {/* SRM with Color */}
          <div className="text-center flex items-center justify-center gap-1.5">
            <div
              className="w-7 h-7 rounded-full ring-2 ring-white/30 shadow-sm"
              style={{ backgroundColor: srmToRgb(calculations.srm) }}
            />
            <div>
              <div className="brew-gauge-label">SRM</div>
              <div className="brew-gauge-value text-lg">
                {calculations.srm.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Calories */}
          <div className="text-center">
            <div className="brew-gauge-label">Cal</div>
            <div className="brew-gauge-value text-lg">
              {calculations.calories}
            </div>
          </div>

          {/* Carbs */}
          <div className="text-center">
            <div className="brew-gauge-label">Carbs</div>
            <div className="brew-gauge-value text-lg">
              {calculations.carbsG.toFixed(1)}g
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
