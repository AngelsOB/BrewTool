/**
 * Beta Builder Page
 *
 * This is your SwiftUI "View" - pure UI, no business logic.
 * It uses the store (like @ObservedObject) and hooks (for calculations).
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../stores/recipeStore';
import { useRecipeCalculations } from '../hooks/useRecipeCalculations';
import FermentableSection from './FermentableSection';
import MashScheduleSection from './MashScheduleSection';
import HopSection from './HopSection';
import YeastSection from './YeastSection';
import WaterSection from './WaterSection';
import FermentationSection from './FermentationSection';
import { EquipmentSection } from './EquipmentSection';
import StyleSelectorModal from './StyleSelectorModal';
import StyleRangeComparison from './StyleRangeComparison';
import { srmToRgb } from '../../utils/srmColorUtils';
import { recipeVersionRepository } from '../../domain/repositories/RecipeVersionRepository';
import BrewDayChecklistSection from './BrewDayChecklistSection';
import StickyStatsBar from './StickyStatsBar';

export default function BetaBuilderPage() {
  const { id, versionNumber } = useParams<{ id?: string; versionNumber?: string }>();
  const navigate = useNavigate();
  const {
    currentRecipe,
    createNewRecipe,
    loadRecipe,
    setCurrentRecipe,
    updateRecipe,
    saveCurrentRecipe,
  } = useRecipeStore();

  const calculations = useRecipeCalculations(currentRecipe);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [showStickyTop, setShowStickyTop] = useState(false);
  const [showStickyBottom, setShowStickyBottom] = useState(false);
  const calculatedValuesRef = React.useRef<HTMLDivElement>(null);
  const isReadOnly = Boolean(versionNumber);

  // Load recipe based on URL param or create new
  useEffect(() => {
    if (id && versionNumber) {
      const version = recipeVersionRepository.loadByRecipeIdAndVersion(
        id,
        Number(versionNumber)
      );
      if (version) {
        setCurrentRecipe({ ...version.recipeSnapshot, id });
      } else {
        setCurrentRecipe(null);
      }
      return;
    }

    if (id) {
      // Editing existing recipe
      loadRecipe(id);
    } else {
      // Creating new recipe
      createNewRecipe();
    }
  }, [id, versionNumber, loadRecipe, createNewRecipe, setCurrentRecipe]);

  // Sticky header scroll detection
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const calculatedValuesEl = calculatedValuesRef.current;

      if (calculatedValuesEl) {
        const rect = calculatedValuesEl.getBoundingClientRect();
        const isPastCalculatedValues = rect.bottom < 0;

        if (isPastCalculatedValues) {
          const scrollDiff = currentScrollY - lastScrollY;

          if (scrollDiff > 0) {
            // Scrolling down - show top header
            setShowStickyTop(true);
            setShowStickyBottom(false);
          } else if (scrollDiff < 0) {
            // Scrolling up - show bottom header
            setShowStickyTop(false);
            setShowStickyBottom(true);
          }
        } else {
          // Not past calculated values - hide both
          setShowStickyTop(false);
          setShowStickyBottom(false);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Removed hard-coded fermentable handler - now using FermentableSection with presets

  if (!currentRecipe) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        {isReadOnly ? (
          <div className="text-center">
            <p className="mb-4">Version not found.</p>
            <button
              onClick={() => navigate('/beta-builder')}
              className="px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))]"
            >
              Back to Recipes
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    );
  }

  const handleSave = () => {
    saveCurrentRecipe();
    navigate('/beta-builder');
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Sticky Stats Bars */}
      {calculations && (
        <>
          <StickyStatsBar
            calculations={calculations}
            position="top"
            isVisible={showStickyTop}
          />
          <StickyStatsBar
            calculations={calculations}
            position="bottom"
            isVisible={showStickyBottom}
          />
        </>
      )}
        {/* Header */}
        <div className="bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] pb-6 mb-6 rounded-t-lg transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/beta-builder')}
                className="text-primary hover:text-primary-strong text-sm mb-2 flex items-center gap-1"
              >
                ← Back to Recipes
              </button>
              <h1 className="text-3xl font-bold text-strong">
                {isReadOnly ? `Version ${versionNumber} (Read-only)` : 'Recipe Builder'}
              </h1>
            </div>
            {isReadOnly && id && (
              <button
                onClick={() => navigate(`/beta-builder/${id}`)}
                className="px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))]"
              >
                Open Current Recipe
              </button>
            )}
          </div>
        </div>

        <div className={isReadOnly ? 'pointer-events-none opacity-90' : ''}>
        {/* Recipe Name & Metadata */}
        <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6 mb-6 space-y-4">
          <div>
            <label htmlFor="recipe-name" className="block text-sm font-semibold mb-2">
              Recipe Name
            </label>
            <input
              id="recipe-name"
              type="text"
              value={currentRecipe.name}
              onChange={(e) => updateRecipe({ name: e.target.value })}
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--surface))] text-strong focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-[rgb(var(--accent))]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span id="bjcp-style-label" className="block text-sm font-semibold mb-2">
                BJCP Style
              </span>
              <button
                aria-labelledby="bjcp-style-label"
                onClick={() => setIsStyleModalOpen(true)}
                className="w-full px-3 py-2 text-left border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))] focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-[rgb(var(--accent))]"
              >
                {currentRecipe.style || <span className="text-muted">Select a style...</span>}
              </button>
            </div>

            <div>
              <label htmlFor="recipe-tags" className="block text-sm font-semibold mb-2">
                Tags (comma-separated)
              </label>
              <input
                id="recipe-tags"
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
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--surface))] text-strong focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-[rgb(var(--accent))]"
              />
            </div>
          </div>

          {/* Calculated Values */}
          {calculations && (
            <div ref={calculatedValuesRef} className="grid grid-cols-5 gap-3">
              {/* ABV */}
              <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-4 text-center shadow-sm">
                <div className="text-xs font-medium text-muted mb-2">
                  Alcohol
                </div>
                <div className="text-2xl font-bold text-strong">
                  {calculations.abv.toFixed(1)}%
                </div>
              </div>

              {/* OG */}
              <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-4 text-center shadow-sm">
                <div className="text-xs font-medium text-muted mb-2">
                  Original Gravity
                </div>
                <div className="text-2xl font-bold text-strong">
                  {calculations.og.toFixed(3)}
                </div>
              </div>

              {/* FG */}
              <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-4 text-center shadow-sm">
                <div className="text-xs font-medium text-muted mb-2">
                  Final Gravity
                </div>
                <div className="text-2xl font-bold text-strong">
                  {calculations.fg.toFixed(3)}
                </div>
              </div>

              {/* IBU */}
              <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-4 text-center shadow-sm">
                <div className="text-xs font-medium text-muted mb-2">
                  Bitterness (IBU)
                </div>
                <div className="text-2xl font-bold text-strong">
                  {calculations.ibu.toFixed(0)}
                </div>
              </div>

              {/* SRM with Color Background */}
              <div
                className="border border-[rgb(var(--border))] rounded-lg p-4 text-center shadow-sm relative overflow-hidden"
                style={{
                  backgroundColor: srmToRgb(calculations.srm)
                }}
              >
                <div className="text-xs font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-2">
                  Color (SRM)
                </div>
                <div className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {calculations.srm.toFixed(1)}
                </div>
              </div>

              {/* Calories */}
              <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-4 text-center shadow-sm">
                <div className="text-xs font-medium text-muted mb-2">
                  Calories
                </div>
                <div className="text-2xl font-bold text-strong">
                  {calculations.calories}
                </div>
                <div className="text-[10px] text-muted">per 12 oz</div>
              </div>

              {/* Carbs */}
              <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg p-4 text-center shadow-sm">
                <div className="text-xs font-medium text-muted mb-2">
                  Carbs
                </div>
                <div className="text-2xl font-bold text-strong">
                  {calculations.carbsG.toFixed(1)}g
                </div>
                <div className="text-[10px] text-muted">per 12 oz</div>
              </div>
            </div>
          )}

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
            <label htmlFor="recipe-notes" className="block text-sm font-semibold mb-2">
              Notes
            </label>
            <textarea
              id="recipe-notes"
              value={currentRecipe.notes || ''}
              onChange={(e) => updateRecipe({ notes: e.target.value || undefined })}
              placeholder="Brew notes, tasting notes, recipe inspiration..."
              rows={3}
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md bg-[rgb(var(--surface))] text-strong focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-[rgb(var(--accent))]"
            />
          </div>
        </div>

        {/* Equipment Profile */}
        <EquipmentSection />

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

        {/* Water - Volumes + Chemistry */}
        <WaterSection calculations={calculations} recipe={currentRecipe} />

        {/* Fermentation - Phase 5 addition */}
        <FermentationSection />

        {/* Brew Day Checklist */}
        <BrewDayChecklistSection />

        {/* Save Button */}
          {!isReadOnly && (
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
          )}
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
