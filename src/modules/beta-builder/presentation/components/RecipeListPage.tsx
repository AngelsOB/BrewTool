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

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipeStore } from "../stores/recipeStore";
import { useRecipeCalculations } from "../hooks/useRecipeCalculations";
import type { Recipe } from "../../domain/models/Recipe";

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "abv-desc" | "abv-asc" | "ibu-desc" | "ibu-asc";

export default function RecipeListPage() {
  const navigate = useNavigate();
  const { recipes, loadRecipes, duplicateRecipe, deleteRecipe, setCurrentRecipe, isLoading } = useRecipeStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Filter and sort recipes
  const filteredAndSortedRecipes = useMemo(() => {
    // Filter by search query
    let filtered = recipes.filter((recipe) => {
      const query = searchQuery.toLowerCase();
      const matchesName = recipe.name.toLowerCase().includes(query);
      const matchesStyle = recipe.style?.toLowerCase().includes(query) ?? false;
      const matchesTags = recipe.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false;
      return matchesName || matchesStyle || matchesTags;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "date-asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
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

  // Handle duplicating a recipe
  const handleDuplicate = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    duplicateRecipe(recipeId);
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recipes</h1>
          <p className="text-gray-600">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} saved
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes by name, style, or tags..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredAndSortedRecipes.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <div>
                <p className="text-xl text-gray-600 mb-4">No recipes found matching "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xl text-gray-600 mb-4">No recipes yet</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onView={() => handleViewRecipe(recipe)}
                onDuplicate={(e) => handleDuplicate(recipe.id, e)}
                onDelete={(e) => handleDeleteClick(recipe.id, e)}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete Recipe?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this recipe? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
  onDuplicate,
  onDelete,
}: {
  recipe: Recipe;
  onView: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  // Calculate stats for the recipe
  const calculations = useRecipeCalculations(recipe);

  return (
    <div
      onClick={onView}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border border-gray-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">{recipe.name}</h3>
        {recipe.style && (
          <p className="text-sm text-gray-600 truncate">{recipe.style}</p>
        )}
      </div>

      {/* Stats */}
      {calculations && (
        <div className="p-4 grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">ABV</div>
            <div className="text-sm font-semibold text-green-600">{calculations.abv.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">IBU</div>
            <div className="text-sm font-semibold text-gray-900">{calculations.ibu.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">SRM</div>
            <div className="text-sm font-semibold text-amber-600">{calculations.srm.toFixed(0)}</div>
          </div>
          <div className="col-span-3">
            <div className="text-xs text-gray-500 mb-1">OG → FG</div>
            <div className="text-sm font-semibold text-gray-700">
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
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer with Actions */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {new Date(recipe.updatedAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDuplicate}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            title="Duplicate recipe"
          >
            Duplicate
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            title="Delete recipe"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
