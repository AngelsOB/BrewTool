/**
 * Water Volumes Display Component
 *
 * Shows the calculated water volumes for brew day:
 * - Mash Water (strike water)
 * - Sparge Water
 * - Pre-Boil Volume
 * - Total Water
 */

import type { RecipeCalculations } from "../../../domain/models/Recipe";

type Props = {
  /** Recipe calculations containing water volume data */
  calculations: RecipeCalculations;
};

export default function WaterVolumesDisplay({ calculations }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg-strong)' }}>
        Volumes
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Mash Water */}
        <div className="rounded-lg p-4" style={{ background: 'rgb(var(--brew-card-inset) / 0.4)', border: '1px solid rgb(var(--brew-border-subtle))', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.04)' }}>
          <div className="text-sm mb-1 font-medium brew-link">
            Mash Water
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            {calculations.mashWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-muted mt-1">
            Strike water
          </div>
        </div>

        {/* Sparge Water */}
        <div className="rounded-lg p-4" style={{ background: 'rgb(var(--brew-card-inset) / 0.4)', border: '1px solid rgb(var(--brew-border-subtle))', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.04)' }}>
          <div className="text-sm mb-1 font-medium brew-link">
            Sparge Water
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            {calculations.spargeWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-muted mt-1">
            For sparging
          </div>
        </div>

        {/* Pre-Boil Volume */}
        <div className="rounded-lg p-4" style={{ background: 'rgb(var(--brew-card-inset) / 0.4)', border: '1px solid rgb(var(--brew-border-subtle))', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.04)' }}>
          <div className="text-sm mb-1 font-medium brew-link">
            Pre-Boil
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            {calculations.preBoilVolumeL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-muted mt-1">
            In kettle
          </div>
        </div>

        {/* Total Water */}
        <div className="rounded-lg p-4" style={{ background: 'rgb(var(--brew-card-inset) / 0.4)', border: '1px solid rgb(var(--brew-border-subtle))', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.04)' }}>
          <div className="text-sm mb-1 font-medium brew-link">
            Total Water
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--fg-strong)' }}>
            {calculations.totalWaterL.toFixed(1)}
            <span className="text-lg ml-1">L</span>
          </div>
          <div className="text-xs text-muted mt-1">
            Grand total
          </div>
        </div>
      </div>
    </div>
  );
}
