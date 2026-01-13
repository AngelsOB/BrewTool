/**
 * Beta Builder Page
 *
 * This is your SwiftUI "View" - pure UI, no business logic.
 * It uses the store (like @ObservedObject) and hooks (for calculations).
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../stores/recipeStore';
import { useRecipeCalculations } from '../hooks/useRecipeCalculations';
import FermentableSection from './FermentableSection';
import MashScheduleSection from './MashScheduleSection';
import HopSection from './HopSection';
import YeastSection from './YeastSection';
import VolumeDisplay from './VolumeDisplay';
import StyleSelectorModal from './StyleSelectorModal';
import StyleRangeComparison from './StyleRangeComparison';

export default function BetaBuilderPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const {
    currentRecipe,
    createNewRecipe,
    loadRecipe,
    updateRecipe,
    saveCurrentRecipe,
  } = useRecipeStore();

  const calculations = useRecipeCalculations(currentRecipe);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  // Load recipe based on URL param or create new
  useEffect(() => {
    if (id) {
      // Editing existing recipe
      loadRecipe(id);
    } else {
      // Creating new recipe
      createNewRecipe();
    }
  }, [id, loadRecipe, createNewRecipe]);

  // Removed hard-coded fermentable handler - now using FermentableSection with presets

  if (!currentRecipe) {
    return <div className="p-8">Loading...</div>;
  }

  const handleSave = () => {
    saveCurrentRecipe();
    navigate('/beta-builder');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(var(--bg))] p-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[rgb(var(--card))] border-b border-gray-200 dark:border-[rgb(var(--border))] pb-6 mb-6 rounded-t-lg transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/beta-builder')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mb-2 flex items-center gap-1"
              >
                ← Back to Recipes
              </button>
              <h1 className="text-3xl font-bold dark:text-gray-100">Recipe Builder</h1>
            </div>
          </div>
        </div>

        {/* Recipe Name & Metadata */}
        <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Recipe Name
            </label>
            <input
              type="text"
              value={currentRecipe.name}
              onChange={(e) => updateRecipe({ name: e.target.value })}
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                BJCP Style
              </label>
              <button
                onClick={() => setIsStyleModalOpen(true)}
                className="w-full px-3 py-2 text-left border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {currentRecipe.style || <span className="text-gray-500 dark:text-gray-400">Select a style...</span>}
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={currentRecipe.tags?.join(', ') || ''}
                onChange={(e) => {
                  const tags = e.target.value
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0);
                  updateRecipe({ tags: tags.length > 0 ? tags : [] });
                }}
                placeholder="e.g., hoppy, sessionable"
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* BJCP Style Range Comparison */}
          {calculations && currentRecipe.style && (
            <div className="pt-2">
              <StyleRangeComparison
                styleCode={currentRecipe.style}
                abv={calculations.abv}
                og={calculations.og}
                fg={calculations.fg}
                ibu={calculations.ibu}
                srm={calculations.srm}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              Notes
            </label>
            <textarea
              value={currentRecipe.notes || ''}
              onChange={(e) => updateRecipe({ notes: e.target.value || undefined })}
              placeholder="Brew notes, tasting notes, recipe inspiration..."
              rows={3}
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Equipment Settings */}
        <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Equipment & Volumes</h2>

          {/* Basic Settings */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Batch Volume (L)
              </label>
              <input
                type="number"
                value={currentRecipe.batchVolumeL}
                onChange={(e) =>
                  updateRecipe({ batchVolumeL: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Mash Efficiency (%)
              </label>
              <input
                type="number"
                value={currentRecipe.equipment.mashEfficiencyPercent}
                onChange={(e) =>
                  updateRecipe({
                    equipment: {
                      ...currentRecipe.equipment,
                      mashEfficiencyPercent: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Boil Time (min)
              </label>
              <input
                type="number"
                value={currentRecipe.equipment.boilTimeMin}
                onChange={(e) =>
                  updateRecipe({
                    equipment: {
                      ...currentRecipe.equipment,
                      boilTimeMin: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                step="1"
              />
            </div>
          </div>

          {/* Advanced Settings - Collapsible */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4">
              Advanced Equipment Settings
            </summary>

            <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-blue-200">
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Boil-Off Rate (L/hr)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.boilOffRateLPerHour}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        boilOffRateLPerHour: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Mash Thickness (L/kg)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.mashThicknessLPerKg}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        mashThicknessLPerKg: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Grain Absorption (L/kg)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.grainAbsorptionLPerKg}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        grainAbsorptionLPerKg: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Mash Tun Deadspace (L)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.mashTunDeadspaceLiters}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        mashTunDeadspaceLiters: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Kettle Loss (L)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.kettleLossLiters}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        kettleLossLiters: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Hop Absorption (L/kg)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.hopsAbsorptionLPerKg}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        hopsAbsorptionLPerKg: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Chiller Loss (L)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.chillerLossLiters}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        chillerLossLiters: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Fermenter Loss (L)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.fermenterLossLiters}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        fermenterLossLiters: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Cooling Shrinkage (%)
                </label>
                <input
                  type="number"
                  value={currentRecipe.equipment.coolingShrinkagePercent}
                  onChange={(e) =>
                    updateRecipe({
                      equipment: {
                        ...currentRecipe.equipment,
                        coolingShrinkagePercent: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm border border-[rgb(var(--border))] rounded-md"
                  step="0.1"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Fermentables - Now using dedicated component with preset picker */}
        <FermentableSection />

        {/* Mash Schedule - Phase 5c addition */}
        <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6">
          <MashScheduleSection />
        </div>

        {/* Hops - Phase 3 addition */}
        <HopSection />

        {/* Yeast - Phase 5 addition */}
        <YeastSection />

        {/* Volume Display - Phase 4 addition */}
        <VolumeDisplay calculations={calculations} />

        {/* Calculations Display */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg shadow-lg p-6 mb-6 border border-green-200/50 dark:border-green-800/50">
          <h2 className="text-xl font-bold mb-4">
            Calculated Values
          </h2>
          {calculations ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[rgb(var(--card))] rounded-lg p-4 shadow">
                <div className="text-sm font-semibold mb-1">OG</div>
                <div className="text-2xl font-bold">
                  {calculations.og.toFixed(3)}
                </div>
              </div>
              <div className="bg-[rgb(var(--card))] rounded-lg p-4 shadow">
                <div className="text-sm font-semibold mb-1">FG</div>
                <div className="text-2xl font-bold">
                  {calculations.fg.toFixed(3)}
                </div>
              </div>
              <div className="bg-[rgb(var(--card))] rounded-lg p-4 shadow">
                <div className="text-sm font-semibold mb-1">ABV</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calculations.abv.toFixed(1)}%
                </div>
              </div>
              <div className="bg-[rgb(var(--card))] rounded-lg p-4 shadow">
                <div className="text-sm font-semibold mb-1">IBU</div>
                <div className="text-2xl font-bold">
                  {calculations.ibu.toFixed(1)}
                </div>
              </div>
              <div className="bg-[rgb(var(--card))] rounded-lg p-4 shadow">
                <div className="text-sm font-semibold mb-1">SRM</div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {calculations.srm.toFixed(1)}
                </div>
              </div>
            </div>
          ) : (
            <p>No calculations available</p>
          )}
        </div>

        {/* Save Button */}
        <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 flex gap-3">
          <button
            onClick={() => navigate('/beta-builder')}
            className="flex-1 px-6 py-3 border border-[rgb(var(--border))] font-semibold rounded-md hover:bg-[rgb(var(--bg))] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>

      {/* Style Selector Modal */}
      <StyleSelectorModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        onSelect={(style) => updateRecipe({ style: style || undefined })}
        currentStyle={currentRecipe.style}
      />
    </div>
  );
}
