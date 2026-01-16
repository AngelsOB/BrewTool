/**
 * Fermentation Section Component
 *
 * Manages fermentation steps similar to mash schedule
 */

import { useState } from 'react';
import { useRecipeStore } from '../stores/recipeStore';
import FermentationStepModal from './FermentationStepModal';
import type { FermentationStep } from '../../domain/models/Recipe';

const STEP_TYPE_LABELS: Record<string, string> = {
  'primary': 'Primary',
  'secondary': 'Secondary',
  'conditioning': 'Conditioning',
  'cold-crash': 'Cold Crash',
  'diacetyl-rest': 'Diacetyl Rest',
};

const STEP_TYPE_COLORS: Record<string, string> = {
  'primary': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  'secondary': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  'conditioning': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
  'cold-crash': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
  'diacetyl-rest': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
};

export default function FermentationSection() {
  const { currentRecipe, updateRecipe } = useRecipeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<FermentationStep | null>(null);

  if (!currentRecipe) return null;

  const steps = currentRecipe.fermentationSteps || [];

  const handleAddStep = () => {
    setEditingStep(null);
    setIsModalOpen(true);
  };

  const handleEditStep = (step: FermentationStep) => {
    setEditingStep(step);
    setIsModalOpen(true);
  };

  const handleSaveStep = (step: FermentationStep) => {
    if (editingStep) {
      // Update existing step
      updateRecipe({
        fermentationSteps: steps.map((s) => (s.id === step.id ? step : s)),
      });
    } else {
      // Add new step
      updateRecipe({
        fermentationSteps: [...steps, step],
      });
    }
  };

  const handleRemoveStep = (stepId: string) => {
    updateRecipe({
      fermentationSteps: steps.filter((s) => s.id !== stepId),
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    updateRecipe({ fermentationSteps: newSteps });
  };

  // Calculate total fermentation time
  const totalDays = steps.reduce((sum, step) => sum + step.durationDays, 0);

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 border-t-4 border-red-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Fermentation Schedule</h2>
          {totalDays > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total time: {totalDays} days
            </p>
          )}
        </div>
        <button
          onClick={handleAddStep}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          + Add Step
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            No fermentation steps yet
          </p>
          <button
            onClick={handleAddStep}
            className="text-red-600 dark:text-red-400 hover:underline text-sm"
          >
            Add your first step
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => {
            const colorClass = STEP_TYPE_COLORS[step.type] || 'bg-gray-100 dark:bg-gray-700';

            // Map step type to background colors
            const bgColors: Record<string, string> = {
              'primary': 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/40',
              'secondary': 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40',
              'conditioning': 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',
              'cold-crash': 'bg-cyan-50/80 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/40',
              'diacetyl-rest': 'bg-pink-50/80 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800/40',
            };
            const bgClass = bgColors[step.type] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';

            return (
              <div
                key={step.id}
                className={`${bgClass} rounded-lg p-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header row with badge, name, duration, and temperature */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${colorClass}`}>
                        {STEP_TYPE_LABELS[step.type] || step.type}
                      </span>
                      <span className="text-sm font-bold">{step.name}</span>

                      {/* Duration and Temperature - Inline */}
                      <div className="flex gap-2 ml-auto">
                        <div className="bg-white/60 dark:bg-gray-900/40 px-3 py-1.5 rounded-md border border-gray-300/50 dark:border-gray-600/50">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                          <div className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {step.durationDays} <span className="text-sm font-normal">days</span>
                          </div>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-900/40 px-3 py-1.5 rounded-md border border-gray-300/50 dark:border-gray-600/50">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Temperature</div>
                          <div className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {step.temperatureC}<span className="text-sm font-normal">°C</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {step.notes && (
                      <div className="text-xs italic bg-white/40 dark:bg-gray-900/30 p-2 rounded border border-gray-300/30 dark:border-gray-600/30">
                        {step.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Move up/down */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* Edit */}
                    <button
                      onClick={() => handleEditStep(step)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Edit step"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete step"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <FermentationStepModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStep(null);
        }}
        onSave={handleSaveStep}
        editingStep={editingStep}
      />
    </div>
  );
}
