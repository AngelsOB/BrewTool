/**
 * Equipment Store
 *
 * Zustand store for managing equipment profiles.
 * Coordinates between the EquipmentRepository and UI components.
 */

import { create } from 'zustand';
import type { EquipmentProfile } from '../../domain/models/Equipment';
import { EquipmentRepository } from '../../domain/repositories/EquipmentRepository';

interface EquipmentStore {
  // State
  profiles: EquipmentProfile[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProfiles: () => Promise<void>;
  saveCustomProfile: (profile: EquipmentProfile) => Promise<void>;
  deleteCustomProfile: (name: string) => Promise<void>;
  clearCache: () => void;
}

export const useEquipmentStore = create<EquipmentStore>((set) => ({
  // Initial state
  profiles: [],
  isLoading: false,
  error: null,

  // Load all profiles
  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await EquipmentRepository.loadAll();
      set({ profiles, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load equipment profiles',
        isLoading: false
      });
    }
  },

  // Save a custom profile
  saveCustomProfile: async (profile: EquipmentProfile) => {
    try {
      await EquipmentRepository.saveCustomProfile(profile);
      // Reload profiles to include the new one
      const profiles = await EquipmentRepository.loadAll();
      set({ profiles, error: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save equipment profile'
      });
    }
  },

  // Delete a custom profile
  deleteCustomProfile: async (name: string) => {
    try {
      await EquipmentRepository.deleteCustomProfile(name);
      // Reload profiles
      const profiles = await EquipmentRepository.loadAll();
      set({ profiles, error: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete equipment profile'
      });
    }
  },

  // Clear cache
  clearCache: () => {
    EquipmentRepository.clearCache();
    set({ profiles: [] });
  },
}));
