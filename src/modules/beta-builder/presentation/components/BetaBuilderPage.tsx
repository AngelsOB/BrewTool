/**
 * Beta Builder Page
 *
 * This is your SwiftUI "View" - pure UI, no business logic.
 * It uses the store (like @ObservedObject) and hooks (for calculations).
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../stores/recipeStore';
import { useRecipeCalculations } from '../hooks/useRecipeCalculations';
import FermentableSection from './FermentableSection';
import MashScheduleSection from './MashScheduleSection';
import HopSection from './HopSection';
import YeastSection from './YeastSection';
import VolumeDisplay from './VolumeDisplay';

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/beta-builder')}
                className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center gap-1"
              >
                ← Back to Recipes
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Recipe Builder</h1>
            </div>
          </div>
        </div>

        {/* Recipe Name & Metadata */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Recipe Name
            </label>
            <input
              type="text"
              value={currentRecipe.name}
              onChange={(e) => updateRecipe({ name: e.target.value })}
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Style
              </label>
              <input
                type="text"
                value={currentRecipe.style || ''}
                onChange={(e) => updateRecipe({ style: e.target.value || undefined })}
                placeholder="e.g., American IPA"
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Notes
            </label>
            <textarea
              value={currentRecipe.notes || ''}
              onChange={(e) => updateRecipe({ notes: e.target.value || undefined })}
              placeholder="Brew notes, tasting notes, recipe inspiration..."
              rows={3}
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Equipment Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Equipment & Volumes</h2>

          {/* Basic Settings */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Batch Volume (L)
              </label>
              <input
                type="number"
                value={currentRecipe.batchVolumeL}
                onChange={(e) =>
                  updateRecipe({ batchVolumeL: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                step="1"
              />
            </div>
          </div>

          {/* Advanced Settings - Collapsible */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 mb-4">
              Advanced Equipment Settings
            </summary>

            <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-blue-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-md"
                  step="0.1"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Fermentables - Now using dedicated component with preset picker */}
        <FermentableSection />

        {/* Mash Schedule - Phase 5c addition */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <MashScheduleSection />
        </div>

        {/* Hops - Phase 3 addition */}
        <HopSection />

        {/* Yeast - Phase 5 addition */}
        <YeastSection />

        {/* Volume Display - Phase 4 addition */}
        <VolumeDisplay calculations={calculations} />

        {/* Calculations Display */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Calculated Values
          </h2>
          {calculations ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm font-semibold text-gray-700 mb-1">OG</div>
                <div className="text-2xl font-bold text-gray-900">
                  {calculations.og.toFixed(3)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm font-semibold text-gray-700 mb-1">FG</div>
                <div className="text-2xl font-bold text-gray-900">
                  {calculations.fg.toFixed(3)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm font-semibold text-gray-700 mb-1">ABV</div>
                <div className="text-2xl font-bold text-green-600">
                  {calculations.abv.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm font-semibold text-gray-700 mb-1">IBU</div>
                <div className="text-2xl font-bold text-gray-900">
                  {calculations.ibu.toFixed(1)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm font-semibold text-gray-700 mb-1">SRM</div>
                <div className="text-2xl font-bold text-amber-600">
                  {calculations.srm.toFixed(1)}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-700">No calculations available</p>
          )}
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow p-6 flex gap-3">
          <button
            onClick={() => navigate('/beta-builder')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
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
    </div>
  );
}
