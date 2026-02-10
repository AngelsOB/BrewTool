/**
 * Fermentation Step Modal Component
 *
 * Modal for adding or editing a fermentation step
 */

import { useState, useEffect } from 'react';
import type { FermentationStep, FermentationStepType } from '../../domain/models/Recipe';
import ModalOverlay from './ModalOverlay';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: FermentationStep) => void;
  editingStep?: FermentationStep | null;
};

const STEP_TYPE_OPTIONS: Array<{ value: FermentationStepType; label: string; defaultName: string; defaultTemp: number; defaultDays: number }> = [
  { value: 'primary', label: 'Primary Fermentation', defaultName: 'Primary Fermentation', defaultTemp: 19, defaultDays: 14 },
  { value: 'secondary', label: 'Secondary Fermentation', defaultName: 'Secondary Fermentation', defaultTemp: 19, defaultDays: 7 },
  { value: 'diacetyl-rest', label: 'Diacetyl Rest', defaultName: 'Diacetyl Rest', defaultTemp: 21, defaultDays: 2 },
  { value: 'cold-crash', label: 'Cold Crash', defaultName: 'Cold Crash', defaultTemp: 2, defaultDays: 3 },
  { value: 'conditioning', label: 'Conditioning / Aging', defaultName: 'Conditioning', defaultTemp: 4, defaultDays: 14 },
];

export default function FermentationStepModal({ isOpen, onClose, onSave, editingStep }: Props) {
  const [stepType, setStepType] = useState<FermentationStepType>('primary');
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [temperatureC, setTemperatureC] = useState(19);
  const [notes, setNotes] = useState('');

  // Initialize form when editing or opening
  useEffect(() => {
    if (editingStep) {
      setStepType(editingStep.type);
      setName(editingStep.name);
      setDurationDays(editingStep.durationDays);
      setTemperatureC(editingStep.temperatureC);
      setNotes(editingStep.notes || '');
    } else {
      // Reset to defaults when adding new
      const defaultOption = STEP_TYPE_OPTIONS[0];
      setStepType(defaultOption.value);
      setName(defaultOption.defaultName);
      setDurationDays(defaultOption.defaultDays);
      setTemperatureC(defaultOption.defaultTemp);
      setNotes('');
    }
  }, [editingStep, isOpen]);

  const handleTypeChange = (newType: FermentationStepType) => {
    setStepType(newType);
    const option = STEP_TYPE_OPTIONS.find(opt => opt.value === newType);
    if (option && !editingStep) {
      // Only auto-fill if creating new (not editing)
      setName(option.defaultName);
      setDurationDays(option.defaultDays);
      setTemperatureC(option.defaultTemp);
    }
  };

  const handleSave = () => {
    const step: FermentationStep = {
      id: editingStep?.id || crypto.randomUUID(),
      name,
      type: stepType,
      durationDays,
      temperatureC,
      notes: notes.trim() || undefined,
    };
    onSave(step);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {editingStep ? 'Edit Fermentation Step' : 'Add Fermentation Step'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Step Type */}
          <div>
            <label htmlFor="fermentation-step-type" className="block text-sm font-semibold mb-2">Step Type</label>
            <select
              id="fermentation-step-type"
              value={stepType}
              onChange={(e) => handleTypeChange(e.target.value as FermentationStepType)}
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
            >
              {STEP_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Step Name */}
          <div>
            <label htmlFor="fermentation-step-name" className="block text-sm font-semibold mb-2">Step Name</label>
            <input
              id="fermentation-step-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Primary Fermentation, Dry Hop"
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
            />
          </div>

          {/* Duration and Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fermentation-step-duration" className="block text-sm font-semibold mb-2">Duration (days)</label>
              <input
                id="fermentation-step-duration"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label htmlFor="fermentation-step-temperature" className="block text-sm font-semibold mb-2">Temperature (°C)</label>
              <input
                id="fermentation-step-temperature"
                type="number"
                value={temperatureC}
                onChange={(e) => setTemperatureC(parseFloat(e.target.value) || 0)}
                step="0.5"
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="fermentation-step-notes" className="block text-sm font-semibold mb-2">Notes (optional)</label>
            <textarea
              id="fermentation-step-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Add dry hops on day 7, Cold crash before packaging"
              rows={3}
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {editingStep ? 'Save Changes' : 'Add Step'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
