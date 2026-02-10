/**
 * BrewDayChecklistSection
 *
 * Shows the brew day checklist with smart defaults and per-recipe customisation.
 * Users can toggle items on/off, edit details, and add custom items.
 */

import { useMemo, useState, useCallback } from 'react';
import { useRecipeStore } from '../stores/recipeStore';
import { useRecipeCalculations } from '../hooks/useRecipeCalculations';
import type { BrewDayChecklistItem, BrewDayStage } from '../../domain/models/Recipe';
import {
  mergeChecklist,
  groupByStage,
  STAGE_META,
} from '../../domain/services/BrewDayChecklistService';

export default function BrewDayChecklistSection() {
  const { currentRecipe, updateRecipe } = useRecipeStore();
  const calculations = useRecipeCalculations(currentRecipe);
  const [isExpanded, setIsExpanded] = useState(false);
  const [addingToStage, setAddingToStage] = useState<BrewDayStage | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemDetails, setNewItemDetails] = useState('');

  const checklist = useMemo(() => {
    if (!currentRecipe) return [];
    return mergeChecklist(currentRecipe, calculations);
  }, [currentRecipe, calculations]);

  const groups = useMemo(() => groupByStage(checklist), [checklist]);

  // Count enabled items
  const enabledCount = checklist.filter(i => i.enabled).length;

  const saveChecklist = useCallback(
    (items: BrewDayChecklistItem[]) => {
      updateRecipe({ brewDayChecklist: items });
    },
    [updateRecipe]
  );

  const handleToggle = useCallback(
    (id: string) => {
      const updated = checklist.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      );
      saveChecklist(updated);
    },
    [checklist, saveChecklist]
  );

  const handleEditDetails = useCallback(
    (id: string, details: string) => {
      const updated = checklist.map(item =>
        item.id === id ? { ...item, details: details || undefined } : item
      );
      saveChecklist(updated);
    },
    [checklist, saveChecklist]
  );

  const handleAddItem = useCallback(
    (stage: BrewDayStage) => {
      if (!newItemLabel.trim()) return;

      const newItem: BrewDayChecklistItem = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        label: newItemLabel.trim(),
        stage,
        details: newItemDetails.trim() || undefined,
        enabled: true,
      };

      saveChecklist([...checklist, newItem]);
      setNewItemLabel('');
      setNewItemDetails('');
      setAddingToStage(null);
    },
    [checklist, newItemLabel, newItemDetails, saveChecklist]
  );

  const handleRemoveCustom = useCallback(
    (id: string) => {
      const updated = checklist.filter(item => item.id !== id);
      saveChecklist(updated);
    },
    [checklist, saveChecklist]
  );

  const handleResetToDefaults = useCallback(() => {
    if (!currentRecipe) return;
    updateRecipe({ brewDayChecklist: undefined });
  }, [currentRecipe, updateRecipe]);

  if (!currentRecipe) return null;

  return (
    <div className="brew-section brew-animate-in brew-stagger-8" data-accent="checklist">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <h2 className="brew-section-title">Brew Day Checklist</h2>
          <span className="brew-tag">
            {enabledCount} items
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-muted transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <p className="text-sm text-muted mt-1">
        Smart reminders for gravity readings, pH checks, and more — included in your brew day printout.
      </p>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Reset button */}
          {currentRecipe.brewDayChecklist && (
            <div className="flex justify-end">
              <button
                onClick={handleResetToDefaults}
                className="text-xs brew-link hover:underline"
              >
                Reset to smart defaults
              </button>
            </div>
          )}

          {/* Stage groups */}
          {groups.length === 0 && checklist.length > 0 && (
            <p className="text-sm text-muted italic">All items are disabled.</p>
          )}

          {/* Show ALL items grouped by stage, including disabled ones for editing */}
          {Object.entries(STAGE_META)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([stage, meta]) => {
              const stageItems = checklist.filter(i => i.stage === stage);
              if (stageItems.length === 0) return null;

              return (
                <div key={stage} className="border-l-2 pl-4" style={{ borderColor: 'rgb(var(--brew-border))' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--fg-strong)' }}>
                    {meta.label}
                  </h3>
                  <ul className="space-y-2">
                    {stageItems.map(item => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onEditDetails={handleEditDetails}
                        onRemove={item.id.startsWith('custom-') ? handleRemoveCustom : undefined}
                      />
                    ))}
                  </ul>

                  {/* Add custom item button */}
                  {addingToStage === stage ? (
                    <div className="mt-2 ml-6 space-y-2 p-3 rounded-md" style={{ background: 'rgb(var(--brew-card-inset))' }}>
                      <input
                        type="text"
                        placeholder="Item label (e.g., 'Check refractometer calibration')"
                        value={newItemLabel}
                        onChange={e => setNewItemLabel(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddItem(stage as BrewDayStage);
                          if (e.key === 'Escape') setAddingToStage(null);
                        }}
                        className="brew-input w-full py-1 px-2 text-sm"
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Details / instructions (optional)"
                        value={newItemDetails}
                        onChange={e => setNewItemDetails(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddItem(stage as BrewDayStage);
                          if (e.key === 'Escape') setAddingToStage(null);
                        }}
                        className="brew-input w-full py-1 px-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddItem(stage as BrewDayStage)}
                          disabled={!newItemLabel.trim()}
                          className="brew-btn-primary text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingToStage(null);
                            setNewItemLabel('');
                            setNewItemDetails('');
                          }}
                          className="brew-btn-ghost text-xs px-3 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingToStage(stage as BrewDayStage);
                        setNewItemLabel('');
                        setNewItemDetails('');
                      }}
                      className="mt-1 ml-6 text-xs brew-link hover:underline"
                    >
                      + Add custom item
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ChecklistItemRow                                                   */
/* ------------------------------------------------------------------ */

function ChecklistItemRow({
  item,
  onToggle,
  onEditDetails,
  onRemove,
}: {
  item: BrewDayChecklistItem;
  onToggle: (id: string) => void;
  onEditDetails: (id: string, details: string) => void;
  onRemove?: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.details ?? '');

  const handleSaveDetails = () => {
    onEditDetails(item.id, editValue);
    setIsEditing(false);
  };

  return (
    <li className="group">
      <div className="flex items-start gap-2">
        {/* Toggle checkbox */}
        <label className="flex items-start gap-2 flex-1 cursor-pointer mt-0.5">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={() => onToggle(item.id)}
            className="mt-0.5 rounded text-[var(--brew-accent-600)] focus:ring-[var(--brew-accent-600)]" style={{ borderColor: 'rgb(var(--brew-border))' }}
          />
          <div className={`flex-1 ${!item.enabled ? 'opacity-50 line-through' : ''}`}>
            <span className="text-sm font-medium" style={{ color: 'var(--fg-strong)' }}>
              {item.label}
            </span>
            {item.details && !isEditing && (
              <p className="text-xs text-muted mt-0.5">
                {item.details}
              </p>
            )}
          </div>
        </label>

        {/* Edit / Remove buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditValue(item.details ?? '');
              setIsEditing(!isEditing);
            }}
            className="p-1 transition-colors" style={{ color: 'var(--fg-muted)' }}
            title="Edit details"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {onRemove && (
            <button
              onClick={() => onRemove(item.id)}
              className="p-1 brew-danger-text transition-colors"
              title="Remove custom item"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Inline details editor — rendered below the row */}
      {isEditing && (
        <div className="ml-6 mt-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveDetails();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              placeholder="Add details / instructions..."
              className="brew-input flex-1 px-2 py-1 text-xs"
              autoFocus
            />
            <button
              onClick={handleSaveDetails}
              className="brew-btn-primary text-xs px-2 py-1"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
