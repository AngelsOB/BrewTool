/**
 * Recipe List Page Component
 *
 * Displays all saved recipes with:
 * - Search by name, style, tags
 * - Filter by style, tags
 * - Sort by date, name, ABV, IBU, SRM
 * - Quick actions: view, duplicate, delete
 * - Create new recipe button
 */

import type React from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipeStore } from "../stores/recipeStore";
import { useBrewSessionStore } from "../stores/brewSessionStore";
import { useRecipeCalculations } from "../hooks/useRecipeCalculations";
import {
  downloadTextFile,
  generateBeerXml,
  generateRecipeMarkdown,
  sanitizeFileName,
} from "../utils/recipeExport";
import type { Recipe } from "../../domain/models/Recipe";
import { srmToRgb } from "../../utils/srmColorUtils";
import VersionHistoryModal from "./VersionHistoryModal";
import RecipeSessionsBar from "./RecipeSessionsBar";
import { toast } from "../../../../stores/toastStore";

type SortOption =
  | "date-desc"
  | "date-asc"
  | "name-asc"
  | "name-desc"
  | "abv-desc"
  | "abv-asc"
  | "ibu-desc"
  | "ibu-asc";

export default function RecipeListPage() {
  const navigate = useNavigate();
  const {
    recipes,
    loadRecipes,
    deleteRecipe,
    setCurrentRecipe,
    isLoading,
    importFromBeerXml,
    importFromJson,
  } = useRecipeStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Filter and sort recipes
  const filteredAndSortedRecipes = useMemo(() => {
    // Filter by search query
    const filtered = recipes.filter((recipe) => {
      const query = searchQuery.toLowerCase();
      const matchesName = recipe.name.toLowerCase().includes(query);
      const matchesStyle = recipe.style?.toLowerCase().includes(query) ?? false;
      const matchesTags =
        recipe.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false;
      return matchesName || matchesStyle || matchesTags;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "date-asc":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        // For ABV/IBU sorting, we need to calculate on-the-fly (not ideal but works)
        case "abv-desc":
        case "abv-asc":
        case "ibu-desc":
        case "ibu-asc":
          // We'll handle this in the render to avoid recalculating every time
          return 0;
        default:
          return 0;
      }
    });

    return sorted;
  }, [recipes, searchQuery, sortBy]);

  // Handle creating a new recipe
  const handleCreateNew = () => {
    setCurrentRecipe(null);
    navigate("/beta-builder/new");
  };

  // Handle viewing/editing a recipe
  const handleViewRecipe = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    navigate(`/beta-builder/${recipe.id}`);
  };

  // Handle delete confirmation
  const handleDeleteClick = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowDeleteConfirm(recipeId);
  };

  const handleDeleteConfirm = () => {
    if (showDeleteConfirm) {
      deleteRecipe(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="brew-theme max-w-6xl mx-auto py-6 px-2">
        <p className="text-center text-muted">Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="brew-theme max-w-6xl mx-auto py-6 px-2">
        {/* Header */}
        <div className="mb-8">
          <h1 className="brew-section-title text-3xl">My Recipes</h1>
          <span className="brew-tag mt-2 inline-block">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </span>
        </div>

        {/* Search and Controls */}
        <div className="brew-section mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by name, style, or tags..."
                className="brew-input w-full"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2 items-center">
              <label htmlFor="recipe-sort-select" className="text-sm font-medium whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="recipe-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="brew-input"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>

            {/* Create New Button */}
            <button
              onClick={handleCreateNew}
              className="brew-btn-primary whitespace-nowrap"
            >
              + New Recipe
            </button>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,text/xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const text =
                      typeof reader.result === "string" ? reader.result : "";
                    const imported = importFromBeerXml(text);
                    if (imported) {
                      loadRecipes();
                      toast.success(`Imported "${imported.name}"`);
                    } else {
                      toast.error("Failed to import BeerXML file");
                    }
                  };
                  reader.readAsText(file);
                  // reset value so same file can be selected again
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="brew-btn-ghost text-xs whitespace-nowrap"
              >
                Import BeerXML
              </button>
              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const text =
                      typeof reader.result === "string" ? reader.result : "";
                    const imported = importFromJson(text);
                    if (imported) {
                      loadRecipes();
                      toast.success(`Imported "${imported.name}"`);
                    } else {
                      toast.error("Failed to import JSON file");
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => jsonFileInputRef.current?.click()}
                className="brew-btn-ghost text-xs whitespace-nowrap"
              >
                Import JSON
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredAndSortedRecipes.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <div>
                <p className="text-xl mb-4 text-muted">
                  No recipes found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="brew-link hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xl mb-2">Your brew log is empty</p>
                <p className="text-sm text-muted mb-6">Start crafting your first recipe</p>
                <button
                  onClick={handleCreateNew}
                  className="brew-btn-primary text-base px-8 py-3"
                >
                  Create Your First Recipe
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredAndSortedRecipes.map((recipe) => (
              <div key={recipe.id} className="flex flex-col overflow-visible">
                <RecipeCard
                  recipe={recipe}
                  onView={() => handleViewRecipe(recipe)}
                  onDelete={(e) => handleDeleteClick(recipe.id, e)}
                />
                <RecipeSessionsBar recipeId={recipe.id} />
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="brew-modal max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Delete Recipe?</h3>
              <p className="text-muted mb-6">
                Are you sure you want to delete this recipe? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="brew-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg transition-colors" style={{ background: 'var(--brew-danger)', color: 'white' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// Recipe Card Component
function RecipeCard({
  recipe,
  onView,
  onDelete,
}: {
  recipe: Recipe;
  onView: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();
  // Calculate stats for the recipe
  const calculations = useRecipeCalculations(recipe);
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [showVariationDialog, setShowVariationDialog] = useState(false);
  const variationNameRef = useRef<HTMLInputElement>(null);
  const { createNewVersion, createVariation } = useRecipeStore();
  const { createSession, saveCurrentSession } = useBrewSessionStore();

  const handleExportMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const md = generateRecipeMarkdown(recipe, calculations);
    downloadTextFile(`${sanitizeFileName(recipe.name)}.md`, md);
  };

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const md = generateRecipeMarkdown(recipe, calculations);
    navigator.clipboard.writeText(md);
  };

  const handleExportJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    const json = JSON.stringify(recipe, null, 2);
    downloadTextFile(
      `${sanitizeFileName(recipe.name)}.json`,
      json,
      "application/json"
    );
  };

  const handleExportBeerXml = (e: React.MouseEvent) => {
    e.stopPropagation();
    const xml = generateBeerXml(recipe);
    downloadTextFile(
      `${sanitizeFileName(recipe.name)}.xml`,
      xml,
      "text/xml"
    );
  };

  const handleNewVersion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNewVersionDialog(true);
  };

  const handleCreateVariation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVariationDialog(true);
  };

  const handleViewHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVersionModal(true);
  };

  const handleStartSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    const session = createSession(recipe);
    saveCurrentSession();
    navigate(`/beta-builder/sessions/${session.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={handleKeyDown}
      className="relative group brew-recipe-card cursor-pointer overflow-visible z-10 focus:outline-none focus:ring-2 focus:ring-[var(--brew-accent-400)] focus:ring-offset-2"
    >
      {/* Version Badge Menu */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={handleStartSession}
          className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-transform hover:-rotate-12"
          style={{ background: 'color-mix(in oklch, var(--brew-accent-200) 40%, transparent)', color: 'var(--brew-accent-700)', border: '1px solid var(--brew-accent-300)' }}
          title="Brew this beer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 8h10v9a3 3 0 01-3 3H7a3 3 0 01-3-3V8z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 9h2a3 3 0 010 6h-2"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVersionMenuOpen((prev) => !prev);
          }}
          className="brew-tag shadow-sm"
          title="Version actions"
        >
          v{recipe.currentVersion}
        </button>
        {isVersionMenuOpen && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            className="absolute right-0 mt-2 p-4 -m-4"
            onMouseLeave={() => setIsVersionMenuOpen(false)}
          >
            <div className="w-40 rounded-lg bg-[rgb(var(--brew-card))] border border-[rgb(var(--brew-border))] shadow-lg overflow-hidden">
              <button
                onClick={(e) => {
                  handleNewVersion(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item w-full text-left"
              >
                New version
              </button>
              <button
                onClick={(e) => {
                  handleCreateVariation(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item w-full text-left"
              >
                New variation
              </button>
              <button
                onClick={(e) => {
                  handleViewHistory(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item w-full text-left"
              >
                View history
              </button>
              <div className="my-1 border-t border-[rgb(var(--brew-border))]" />
              <button
                onClick={(e) => {
                  handleExportMarkdown(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item w-full text-left"
              >
                Export Markdown
              </button>
              <button
                onClick={(e) => {
                  handleCopyMarkdown(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item w-full text-left"
              >
                Copy Markdown
              </button>
              <button
                onClick={(e) => {
                  handleExportJson(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item w-full text-left"
              >
                Export JSON
              </button>
              <button
                onClick={(e) => {
                  handleExportBeerXml(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item w-full text-left"
              >
                Export BeerXML
              </button>
              <div className="my-1 border-t border-[rgb(var(--brew-border))]" />
              <button
                onClick={(e) => {
                  onDelete(e);
                  setIsVersionMenuOpen(false);
                }}
                className="brew-menu-item brew-danger-text w-full text-left"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[rgb(var(--brew-card))] rounded-xl border border-[rgb(var(--brew-border))] overflow-hidden">
        {/* SRM Color Strip */}
        {calculations && (
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: srmToRgb(calculations.srm) }}
          />
        )}

        {/* Header */}
        <div className="p-4 border-b border-[rgb(var(--brew-border))]">
          <h3 className="font-semibold text-lg mb-1 truncate">{recipe.name}</h3>
          {recipe.style && <p className="text-sm text-muted truncate">{recipe.style}</p>}
        </div>

        {/* Stats */}
        {calculations && (
          <div className="p-4 grid grid-cols-3 gap-2">
            <div>
              <div className="brew-gauge-label text-[10px]">ABV</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--brew-accent-700)' }}>
                {calculations.abv.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="brew-gauge-label text-[10px]">IBU</div>
              <div className="text-sm font-bold tabular-nums">
                {calculations.ibu.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="brew-gauge-label text-[10px]">SRM</div>
              <div className="flex items-center gap-1">
                <div
                  className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: srmToRgb(calculations.srm) }}
                />
                <span className="text-sm font-bold tabular-nums">
                  {calculations.srm.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="col-span-3">
              <div className="brew-gauge-label text-[10px]">OG / FG</div>
              <div className="text-sm font-bold tabular-nums">
                {calculations.og.toFixed(3)} → {calculations.fg.toFixed(3)}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="brew-tag">
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="brew-tag">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[rgb(var(--brew-card-inset))] border-t border-[rgb(var(--brew-border))] rounded-b-xl">
          <div className="text-xs text-muted">
            {new Date(recipe.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* New Version Dialog */}
      {showNewVersionDialog && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-version-dialog-title"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowNewVersionDialog(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setShowNewVersionDialog(false);
            }
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="brew-modal max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="new-version-dialog-title" className="text-lg font-semibold mb-4">Create New Version</h3>
            <p className="text-sm text-muted mb-4">
              This will save the current state of "{recipe.name}" as version{" "}
              {recipe.currentVersion} and increment to version{" "}
              {recipe.currentVersion + 1}.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNewVersionDialog(false);
                }}
                className="brew-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  createNewVersion(recipe.id);
                  setShowNewVersionDialog(false);
                }}
                className="brew-btn-primary"
              >
                Create Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Variation Dialog */}
      {showVariationDialog && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-variation-dialog-title"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowVariationDialog(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setShowVariationDialog(false);
            }
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="brew-modal max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-variation-dialog-title" className="text-lg font-semibold mb-4">Create Variation</h3>
            <p className="text-sm text-muted mb-4">
              This will create a new recipe based on "{recipe.name}" (v
              {recipe.currentVersion}).
            </p>
            <input
              type="text"
              defaultValue={`${recipe.name} - Variation`}
              ref={variationNameRef}
              className="brew-input w-full mb-4"
              placeholder="New recipe name"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVariationDialog(false);
                }}
                className="brew-btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = variationNameRef.current?.value || `${recipe.name} - Variation`;
                  createVariation(recipe.id, newName);
                  setShowVariationDialog(false);
                }}
                className="brew-btn-primary"
              >
                Create Variation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      <VersionHistoryModal
        recipe={recipe}
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
      />
    </div>
  );
}
