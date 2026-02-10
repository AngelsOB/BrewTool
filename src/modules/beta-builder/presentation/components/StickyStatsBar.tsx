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
      className={`fixed left-0 right-0 bg-[rgb(var(--card))]/95 backdrop-blur-sm border-[rgb(var(--border))] shadow-lg z-40 transition-all duration-300 ease-in-out ${positionClasses} ${translateClasses}`}
    >
      <div className="max-w-4xl mx-auto px-8 py-2">
        <div className="grid grid-cols-7 gap-2">
          {/* ABV */}
          <div className="text-center">
            <div className="text-[10px] font-medium text-muted">Alcohol</div>
            <div className="text-lg font-bold text-strong">
              {calculations.abv.toFixed(1)}%
            </div>
          </div>

          {/* OG */}
          <div className="text-center">
            <div className="text-[10px] font-medium text-muted">
              Original Gravity
            </div>
            <div className="text-lg font-bold text-strong">
              {calculations.og.toFixed(3)}
            </div>
          </div>

          {/* FG */}
          <div className="text-center">
            <div className="text-[10px] font-medium text-muted">
              Final Gravity
            </div>
            <div className="text-lg font-bold text-strong">
              {calculations.fg.toFixed(3)}
            </div>
          </div>

          {/* IBU */}
          <div className="text-center">
            <div className="text-[10px] font-medium text-muted">
              Bitterness (IBU)
            </div>
            <div className="text-lg font-bold text-strong">
              {calculations.ibu.toFixed(0)}
            </div>
          </div>

          {/* SRM with Color */}
          <div className="text-center flex items-center justify-center gap-1">
            <div
              className="w-6 h-6 rounded border border-[rgb(var(--border))] shadow-sm"
              style={{ backgroundColor: srmToRgb(calculations.srm) }}
            />
            <div>
              <div className="text-[10px] font-medium text-muted">
                Color (SRM)
              </div>
              <div className="text-lg font-bold text-strong">
                {calculations.srm.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Calories */}
          <div className="text-center">
            <div className="text-[10px] font-medium text-muted">Calories</div>
            <div className="text-lg font-bold text-strong">
              {calculations.calories}
            </div>
          </div>

          {/* Carbs */}
          <div className="text-center">
            <div className="text-[10px] font-medium text-muted">Carbs</div>
            <div className="text-lg font-bold text-strong">
              {calculations.carbsG.toFixed(1)}g
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
