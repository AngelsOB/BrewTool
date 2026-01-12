/**
 * PresetRepository
 *
 * Handles loading preset data (fermentables, hops, yeasts) from both:
 * 1. Generated preset databases (committed with the app)
 * 2. User custom presets (stored in localStorage)
 *
 * This repository provides:
 * - Memoized preset loading (load once, cache in memory)
 * - Merging of generated + custom presets
 * - Deduplication by name
 * - Saving custom presets
 */

import type { FermentablePreset, HopPreset, YeastPreset } from "../models/Presets";
import {
  FERMENTABLE_PRESETS,
  groupFermentables,
  type FermentableGroup,
} from "../../data/fermentablePresets";

// Storage keys for custom presets
const CUSTOM_FERMENTABLES_KEY = "beta-custom-fermentables-v1";
const CUSTOM_HOPS_KEY = "beta-custom-hops-v1";
const CUSTOM_YEASTS_KEY = "beta-custom-yeasts-v1";

/**
 * PresetRepository class
 *
 * Provides access to preset databases with caching and custom preset support.
 */
export class PresetRepository {
  // In-memory cache
  private fermentablePresetsCache: FermentablePreset[] | null = null;
  private hopPresetsCache: HopPreset[] | null = null;
  private yeastPresetsCache: YeastPreset[] | null = null;

  /**
   * Load all fermentable presets (generated + custom)
   *
   * Results are cached in memory. Subsequent calls return the cached value.
   */
  loadFermentablePresets(): FermentablePreset[] {
    // Return cached if available
    if (this.fermentablePresetsCache) {
      return this.fermentablePresetsCache;
    }

    // Load custom presets from localStorage
    const custom = this.loadCustomFermentables();

    // Merge generated + custom, deduplicating by name (custom overrides generated)
    const byName = new Map<string, FermentablePreset>();

    // Add generated presets first
    for (const preset of FERMENTABLE_PRESETS) {
      byName.set(preset.name, preset);
    }

    // Add custom presets (will override if same name)
    for (const preset of custom) {
      byName.set(preset.name, preset);
    }

    // Convert back to array and cache
    this.fermentablePresetsCache = Array.from(byName.values());

    return this.fermentablePresetsCache;
  }

  /**
   * Load fermentable presets grouped by category
   */
  loadFermentablePresetsGrouped(): Array<{
    label: FermentableGroup;
    items: FermentablePreset[];
  }> {
    const presets = this.loadFermentablePresets();
    return groupFermentables(presets);
  }

  /**
   * Save a custom fermentable preset
   */
  saveFermentablePreset(preset: FermentablePreset): void {
    const custom = this.loadCustomFermentables();

    // Check if already exists
    const index = custom.findIndex((p) => p.name === preset.name);

    if (index >= 0) {
      // Update existing
      custom[index] = preset;
    } else {
      // Add new
      custom.push(preset);
    }

    // Save to localStorage
    localStorage.setItem(CUSTOM_FERMENTABLES_KEY, JSON.stringify(custom));

    // Clear cache to force reload next time
    this.fermentablePresetsCache = null;
  }

  /**
   * Load custom fermentables from localStorage
   */
  private loadCustomFermentables(): FermentablePreset[] {
    try {
      const json = localStorage.getItem(CUSTOM_FERMENTABLES_KEY);
      if (!json) return [];

      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) return [];

      return parsed;
    } catch (error) {
      console.error("Error loading custom fermentables:", error);
      return [];
    }
  }

  /**
   * Load all hop presets (generated + custom)
   *
   * Placeholder for Phase 3 - Hops
   */
  loadHopPresets(): HopPreset[] {
    if (this.hopPresetsCache) {
      return this.hopPresetsCache;
    }

    // TODO: Phase 3 - Load hop presets
    this.hopPresetsCache = [];
    return this.hopPresetsCache;
  }

  /**
   * Save a custom hop preset
   *
   * Placeholder for Phase 3 - Hops
   */
  saveHopPreset(preset: HopPreset): void {
    // TODO: Phase 3 - Implement hop preset saving
    console.log("saveHopPreset not yet implemented:", preset);
  }

  /**
   * Load all yeast presets (generated + custom)
   *
   * Placeholder for Phase 5 - Yeast
   */
  loadYeastPresets(): YeastPreset[] {
    if (this.yeastPresetsCache) {
      return this.yeastPresetsCache;
    }

    // TODO: Phase 5 - Load yeast presets
    this.yeastPresetsCache = [];
    return this.yeastPresetsCache;
  }

  /**
   * Save a custom yeast preset
   *
   * Placeholder for Phase 5 - Yeast
   */
  saveYeastPreset(preset: YeastPreset): void {
    // TODO: Phase 5 - Implement yeast preset saving
    console.log("saveYeastPreset not yet implemented:", preset);
  }

  /**
   * Clear all caches
   *
   * Useful for testing or when presets are updated externally
   */
  clearCache(): void {
    this.fermentablePresetsCache = null;
    this.hopPresetsCache = null;
    this.yeastPresetsCache = null;
  }
}

// Export a singleton instance
export const presetRepository = new PresetRepository();
