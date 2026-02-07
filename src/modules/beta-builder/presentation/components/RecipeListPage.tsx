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
import { useEffect, useState, useMemo } from "react";
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
import { useRef } from "react";
import VersionHistoryModal from "./VersionHistoryModal";
import RecipeSessionsBar from "./RecipeSessionsBar";

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
  } = useRecipeStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      <div className="min-h-screen bg-[rgb(var(--bg))] p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Recipes</h1>
          <p>
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} saved
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-[rgb(var(--card))] rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by name, style, or tags..."
                className="w-full px-4 py-2 border border-[rgb(var(--border))] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium whitespace-nowrap">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-[rgb(var(--border))] rounded-md focus:ring-2 focus:ring-blue-500"
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
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
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
                    } else {
                      alert("Failed to import BeerXML");
                    }
                  };
                  reader.readAsText(file);
                  // reset value so same file can be selected again
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))] whitespace-nowrap"
              >
                Import BeerXML
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredAndSortedRecipes.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <div>
                <p className="text-xl mb-4">
                  No recipes found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xl mb-4">No recipes yet</p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[rgb(var(--card))] rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete Recipe?</h3>
              <p className="text-black mb-6">
                Are you sure you want to delete this recipe? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
  const { createNewVersion, createVariation } = useRecipeStore();
  const { createSession, saveCurrentSession } = useBrewSessionStore();

  const handleExportMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const md = generateRecipeMarkdown(recipe, calculations);
    downloadTextFile(`${sanitizeFileName(recipe.name)}.md`, md);
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

  return (
    <div
      onClick={onView}
      className="relative group rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-visible z-10"
    >
      {/* Version Badge Menu */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={handleStartSession}
          className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-sm hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-transform hover:-rotate-12"
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
          className="px-2 py-1 text-xs font-semibold rounded-full bg-[rgb(var(--bg))] border border-[rgb(var(--border))] shadow-sm hover:bg-white dark:hover:bg-gray-800"
          title="Version actions"
        >
          v{recipe.currentVersion}
        </button>
        {isVersionMenuOpen && (
          <div
            className="absolute right-0 mt-2 p-4 -m-4"
            onMouseLeave={() => setIsVersionMenuOpen(false)}
          >
            <div className="w-40 rounded-md bg-white dark:bg-gray-900 border border-[rgb(var(--border))] shadow-lg overflow-hidden">
              <button
                onClick={(e) => {
                  handleNewVersion(e);
                  setIsVersionMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                New version
              </button>
              <button
                onClick={(e) => {
                  handleCreateVariation(e);
                  setIsVersionMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                New variation
              </button>
              <button
                onClick={(e) => {
                  handleViewHistory(e);
                  setIsVersionMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                View history
              </button>
              <div className="my-1 border-t border-[rgb(var(--border))]" />
              <button
                onClick={(e) => {
                  handleExportMarkdown(e);
                  setIsVersionMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Export Markdown
              </button>
              <button
                onClick={(e) => {
                  handleExportJson(e);
                  setIsVersionMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Export JSON
              </button>
              <button
                onClick={(e) => {
                  handleExportBeerXml(e);
                  setIsVersionMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Export BeerXML
              </button>
              <div className="my-1 border-t border-[rgb(var(--border))]" />
              <button
                onClick={(e) => {
                  onDelete(e);
                  setIsVersionMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[rgb(var(--border))]">
          <h3 className="font-semibold text-lg mb-1 truncate">{recipe.name}</h3>
          {recipe.style && <p className="text-sm truncate">{recipe.style}</p>}
        </div>

        {/* Stats */}
        {calculations && (
          <div className="p-4 grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs mb-1">ABV</div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {calculations.abv.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs mb-1">IBU</div>
              <div className="text-sm font-semibold">
                {calculations.ibu.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1">SRM</div>
              <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {calculations.srm.toFixed(0)}
              </div>
            </div>
            <div className="col-span-3">
              <div className="text-xs mb-1">OG → FG</div>
              <div className="text-sm font-semibold">
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
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded"
                >
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer with Actions */}
        <div className="p-3 bg-[rgb(var(--bg))] border-t border-[rgb(var(--border))] flex items-center justify-between rounded-b-lg">
          <div className="text-xs">
            {new Date(recipe.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex gap-2 flex-wrap justify-end"></div>
        </div>
      </div>

      {/* New Version Dialog */}
      {showNewVersionDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowNewVersionDialog(false);
          }}
        >
          <div
            className="bg-[rgb(var(--card))] rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create New Version</h3>
            <p className="text-sm mb-4">
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
                className="px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))]"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  createNewVersion(recipe.id);
                  setShowNewVersionDialog(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Variation Dialog */}
      {showVariationDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowVariationDialog(false);
          }}
        >
          <div
            className="bg-[rgb(var(--card))] rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create Variation</h3>
            <p className="text-sm mb-4">
              This will create a new recipe based on "{recipe.name}" (v
              {recipe.currentVersion}).
            </p>
            <input
              type="text"
              defaultValue={`${recipe.name} - Variation`}
              id="variation-name"
              className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-md mb-4"
              placeholder="New recipe name"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVariationDialog(false);
                }}
                className="px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-[rgb(var(--bg))]"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.getElementById(
                    "variation-name"
                  ) as HTMLInputElement;
                  const newName = input?.value || `${recipe.name} - Variation`;
                  createVariation(recipe.id, newName);
                  setShowVariationDialog(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Variation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionModal && (
        <VersionHistoryModal
          recipe={recipe}
          onClose={() => setShowVersionModal(false)}
        />
      )}
    </div>
  );
}
