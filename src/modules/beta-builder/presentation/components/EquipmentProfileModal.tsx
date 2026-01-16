/**
 * Equipment Profile Modal Component
 *
 * Modal for selecting or creating equipment profiles.
 */

import React, { useState } from 'react';
import { useEquipmentStore } from '../stores/equipmentStore';
import type { EquipmentProfile } from '../../domain/models/Equipment';

interface EquipmentProfileModalProps {
  onClose: () => void;
  onSelect: (profile: EquipmentProfile) => void;
  onCreateCustom: () => void;
}

export const EquipmentProfileModal: React.FC<EquipmentProfileModalProps> = ({
  onClose,
  onSelect,
  onCreateCustom,
}) => {
  const { profiles } = useEquipmentStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter profiles by search term
  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group profiles by type (preset vs custom)
  const presetProfiles = filteredProfiles.filter(p => !p.isCustom);
  const customProfiles = filteredProfiles.filter(p => p.isCustom);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Select Equipment Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search equipment profiles..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Preset Profiles */}
          {presetProfiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                Preset Profiles
              </h3>
              <div className="space-y-2">
                {presetProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.name}
                    profile={profile}
                    onSelect={() => onSelect(profile)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Profiles */}
          {customProfiles.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                Custom Profiles
              </h3>
              <div className="space-y-2">
                {customProfiles.map((profile) => (
                  <ProfileCard
                    key={profile.name}
                    profile={profile}
                    onSelect={() => onSelect(profile)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredProfiles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No equipment profiles found
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onCreateCustom}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            + Create Custom
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Card Component
interface ProfileCardProps {
  profile: EquipmentProfile;
  onSelect: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {profile.name}
          </h4>
          {profile.isCustom && (
            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
              Custom
            </span>
          )}
        </div>
      </div>

      {profile.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {profile.description}
        </p>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Batch:</span>{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {profile.batchSizeL.toFixed(1)}L
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Boil:</span>{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {profile.boilTimeMin}min
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Mash Eff:</span>{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {profile.mashEfficiency}%
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">BH Eff:</span>{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {profile.brewhouseEfficiency}%
          </span>
        </div>
      </div>
    </button>
  );
};
