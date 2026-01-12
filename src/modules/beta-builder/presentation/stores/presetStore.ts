/**
 * Preset Store
 *
 * Manages cached presets for fermentables, hops, and yeasts.
 * Loads from PresetRepository and caches in memory for performance.
 */

import { create } from "zustand";
import type { FermentablePreset, HopPreset, YeastPreset } from "../../domain/models/Presets";
import { presetRepository } from "../../domain/repositories/PresetRepository";
import type { FermentableGroup } from "../../data/fermentablePresets";

type PresetStore = {
  // State
  fermentablePresets: FermentablePreset[];
  fermentablePresetsGrouped: Array<{ label: FermentableGroup; items: FermentablePreset[] }>;
  hopPresets: HopPreset[];
  yeastPresets: YeastPreset[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFermentablePresets: () => void;
  loadHopPresets: () => void;
  loadYeastPresets: () => void;
  saveFermentablePreset: (preset: FermentablePreset) => void;
  saveHopPreset: (preset: HopPreset) => void;
  saveYeastPreset: (preset: YeastPreset) => void;
  clearCache: () => void;
};

export const usePresetStore = create<PresetStore>((set, get) => ({
  // Initial state
  fermentablePresets: [],
  fermentablePresetsGrouped: [],
  hopPresets: [],
  yeastPresets: [],
  isLoading: false,
  error: null,

  // Load fermentable presets
  loadFermentablePresets: () => {
    // Skip if already loaded
    if (get().fermentablePresets.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const fermentablePresets = presetRepository.loadFermentablePresets();
      const fermentablePresetsGrouped = presetRepository.loadFermentablePresetsGrouped();
      set({ fermentablePresets, fermentablePresetsGrouped, isLoading: false });
    } catch (error) {
      set({ error: "Failed to load fermentable presets", isLoading: false });
      console.error("Error loading fermentable presets:", error);
    }
  },

  // Load hop presets (Phase 3)
  loadHopPresets: () => {
    if (get().hopPresets.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const hopPresets = presetRepository.loadHopPresets();
      set({ hopPresets, isLoading: false });
    } catch (error) {
      set({ error: "Failed to load hop presets", isLoading: false });
      console.error("Error loading hop presets:", error);
    }
  },

  // Load yeast presets (Phase 5)
  loadYeastPresets: () => {
    if (get().yeastPresets.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const yeastPresets = presetRepository.loadYeastPresets();
      set({ yeastPresets, isLoading: false });
    } catch (error) {
      set({ error: "Failed to load yeast presets", isLoading: false });
      console.error("Error loading yeast presets:", error);
    }
  },

  // Save a custom fermentable preset
  saveFermentablePreset: (preset: FermentablePreset) => {
    try {
      presetRepository.saveFermentablePreset(preset);
      // Reload presets
      presetRepository.clearCache();
      set({
        fermentablePresets: [],
        fermentablePresetsGrouped: [],
      });
      get().loadFermentablePresets();
    } catch (error) {
      set({ error: "Failed to save fermentable preset" });
      console.error("Error saving fermentable preset:", error);
    }
  },

  // Save a custom hop preset (Phase 3)
  saveHopPreset: (preset: HopPreset) => {
    try {
      presetRepository.saveHopPreset(preset);
      // Reload presets
      presetRepository.clearCache();
      set({ hopPresets: [] });
      get().loadHopPresets();
    } catch (error) {
      set({ error: "Failed to save hop preset" });
      console.error("Error saving hop preset:", error);
    }
  },

  // Save a custom yeast preset (Phase 5)
  saveYeastPreset: (preset: YeastPreset) => {
    try {
      presetRepository.saveYeastPreset(preset);
      // Reload presets
      presetRepository.clearCache();
      set({ yeastPresets: [] });
      get().loadYeastPresets();
    } catch (error) {
      set({ error: "Failed to save yeast preset" });
      console.error("Error saving yeast preset:", error);
    }
  },

  // Clear all cached presets
  clearCache: () => {
    presetRepository.clearCache();
    set({
      fermentablePresets: [],
      fermentablePresetsGrouped: [],
      hopPresets: [],
      yeastPresets: [],
    });
  },
}));
