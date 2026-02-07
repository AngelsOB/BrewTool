/**
 * RecipeRepository
 *
 * This is your "Data Layer" from SwiftUI.
 * Handles all data persistence (localStorage, future: API calls, IndexedDB, etc.)
 * Services use this instead of touching localStorage directly.
 */

import type { Recipe, RecipeId } from '../models/Recipe';

export class RecipeRepository {
  private readonly STORAGE_KEY = 'beer-recipes-v1';

  /**
   * Load all recipes from storage
   */
  loadAll(): Recipe[] {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) return [];

      const recipes = JSON.parse(json) as Recipe[];

      // Migrate old recipes to include currentVersion, otherIngredients, and yeasts fields
      const migratedRecipes = recipes.map(recipe => {
        let migrated = recipe as Record<string, unknown> & Recipe;
        if (migrated.currentVersion === undefined) {
          migrated = { ...migrated, currentVersion: 1 };
        }
        if (!migrated.otherIngredients) {
          migrated = { ...migrated, otherIngredients: [] };
        }
        // Migrate yeast (single) → yeasts (array)
        if (!migrated.yeasts) {
          const oldYeast = (migrated as Record<string, unknown>).yeast;
          migrated = { ...migrated, yeasts: oldYeast ? [oldYeast] : [] } as typeof migrated;
          delete (migrated as Record<string, unknown>).yeast;
        }
        return migrated as Recipe;
      });

      // Save migrated recipes if any migration occurred
      if (migratedRecipes.some((r, i) => r !== recipes[i])) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedRecipes));
      }

      return migratedRecipes;
    } catch (error) {
      console.error('Failed to load recipes:', error);
      return [];
    }
  }

  /**
   * Load a single recipe by ID
   */
  loadById(id: RecipeId): Recipe | null {
    const recipes = this.loadAll();
    return recipes.find((r) => r.id === id) ?? null;
  }

  /**
   * Save a recipe (create or update)
   */
  save(recipe: Recipe): void {
    try {
      const recipes = this.loadAll();
      const existingIndex = recipes.findIndex((r) => r.id === recipe.id);

      const updatedRecipe = {
        ...recipe,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Update existing
        recipes[existingIndex] = updatedRecipe;
      } else {
        // Create new
        recipes.push(updatedRecipe);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error('Failed to save recipe:', error);
      throw new Error('Could not save recipe. Storage may be full.');
    }
  }

  /**
   * Delete a recipe by ID
   */
  delete(id: RecipeId): void {
    try {
      const recipes = this.loadAll();
      const filtered = recipes.filter((r) => r.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      throw new Error('Could not delete recipe.');
    }
  }

  /**
   * Delete all recipes (for testing/reset)
   */
  deleteAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recipes:', error);
    }
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const recipeRepository = new RecipeRepository();
