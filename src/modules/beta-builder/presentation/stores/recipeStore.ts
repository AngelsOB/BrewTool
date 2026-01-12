/**
 * Recipe Store
 *
 * This is like your SwiftUI ObservableObject with @Published properties.
 * Holds the current state and provides actions to modify it.
 * Coordinates between Repository (data) and UI (components).
 */

import { create } from 'zustand';
import type { Recipe, RecipeId, Fermentable, Hop } from '../../domain/models/Recipe';
import { recipeRepository } from '../../domain/repositories/RecipeRepository';

type RecipeStore = {
  // State (like @Published properties)
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  isLoading: boolean;
  error: string | null;

  // Actions (like your manager methods)
  loadRecipes: () => void;
  loadRecipe: (id: RecipeId) => void;
  createNewRecipe: () => void;
  updateRecipe: (updates: Partial<Recipe>) => void;
  saveCurrentRecipe: () => void;
  deleteRecipe: (id: RecipeId) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;

  // Ingredient actions
  addFermentable: (fermentable: Fermentable) => void;
  updateFermentable: (id: string, updates: Partial<Fermentable>) => void;
  removeFermentable: (id: string) => void;
  addHop: (hop: Hop) => void;
  updateHop: (id: string, updates: Partial<Hop>) => void;
  removeHop: (id: string) => void;
};

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  // Initial state
  recipes: [],
  currentRecipe: null,
  isLoading: false,
  error: null,

  // Load all recipes
  loadRecipes: () => {
    set({ isLoading: true, error: null });
    try {
      const recipes = recipeRepository.loadAll();
      set({ recipes, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load recipes', isLoading: false });
    }
  },

  // Load a specific recipe
  loadRecipe: (id: RecipeId) => {
    set({ isLoading: true, error: null });
    try {
      const recipe = recipeRepository.loadById(id);
      set({ currentRecipe: recipe, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load recipe', isLoading: false });
    }
  },

  // Create a new recipe with defaults
  createNewRecipe: () => {
    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      name: 'New Recipe',
      batchVolumeL: 20,
      equipment: {
        boilTimeMin: 60,
        boilOffRateLPerHour: 4,
        mashEfficiencyPercent: 75,
        mashThicknessLPerKg: 3.0,
        grainAbsorptionLPerKg: 1.04,
        mashTunDeadspaceLiters: 2.0,
        kettleLossLiters: 1.0,
        hopsAbsorptionLPerKg: 0.7, // NO LONGER OPTIONAL - required default!
        chillerLossLiters: 0.5,
        fermenterLossLiters: 0.5,
        coolingShrinkagePercent: 4.0,
      },
      fermentables: [],
      hops: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: newRecipe });
  },

  // Update current recipe (doesn't save to storage yet)
  updateRecipe: (updates: Partial<Recipe>) => {
    const current = get().currentRecipe;
    if (!current) return;

    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: updated });
  },

  // Save current recipe to storage
  saveCurrentRecipe: () => {
    const current = get().currentRecipe;
    if (!current) return;

    try {
      recipeRepository.save(current);
      // Reload recipes list
      get().loadRecipes();
      set({ error: null });
    } catch (error) {
      set({ error: 'Failed to save recipe' });
    }
  },

  // Delete a recipe
  deleteRecipe: (id: RecipeId) => {
    try {
      recipeRepository.delete(id);
      // Clear current recipe if it was deleted
      const current = get().currentRecipe;
      if (current?.id === id) {
        set({ currentRecipe: null });
      }
      // Reload recipes list
      get().loadRecipes();
      set({ error: null });
    } catch (error) {
      set({ error: 'Failed to delete recipe' });
    }
  },

  // Set current recipe directly
  setCurrentRecipe: (recipe: Recipe | null) => {
    set({ currentRecipe: recipe });
  },

  // Add a fermentable
  addFermentable: (fermentable: Fermentable) => {
    const current = get().currentRecipe;
    if (!current) return;

    const updated = {
      ...current,
      fermentables: [...current.fermentables, fermentable],
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: updated });
  },

  // Update a fermentable
  updateFermentable: (id: string, updates: Partial<Fermentable>) => {
    const current = get().currentRecipe;
    if (!current) return;

    const updated = {
      ...current,
      fermentables: current.fermentables.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: updated });
  },

  // Remove a fermentable
  removeFermentable: (id: string) => {
    const current = get().currentRecipe;
    if (!current) return;

    const updated = {
      ...current,
      fermentables: current.fermentables.filter((f) => f.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: updated });
  },

  // Add a hop
  addHop: (hop: Hop) => {
    const current = get().currentRecipe;
    if (!current) return;

    const updated = {
      ...current,
      hops: [...current.hops, hop],
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: updated });
  },

  // Update a hop
  updateHop: (id: string, updates: Partial<Hop>) => {
    const current = get().currentRecipe;
    if (!current) return;

    const updated = {
      ...current,
      hops: current.hops.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: updated });
  },

  // Remove a hop
  removeHop: (id: string) => {
    const current = get().currentRecipe;
    if (!current) return;

    const updated = {
      ...current,
      hops: current.hops.filter((h) => h.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentRecipe: updated });
  },
}));
