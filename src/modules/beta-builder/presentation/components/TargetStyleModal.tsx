/**
 * Target Style Modal Component
 *
 * Modal for selecting beer style-based water profiles
 * Follows the same pattern as FermentableSection, HopSection, YeastSection modals
 */

import { BEER_STYLE_TARGETS } from "../../domain/services/WaterChemistryService";
import ModalOverlay from "./ModalOverlay";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (styleName: string) => void;
  currentStyleName?: string;
};

// Categorize styles for better organization
const STYLE_CATEGORIES = {
  "Hoppy Ales": [
    "West Coast IPA",
    "American IPA",
    "American Pale Ale",
    "NEIPA / Hazy IPA",
    "English IPA",
  ],
  "Lagers": [
    "Pilsner",
    "German Pilsner",
    "Munich Helles",
  ],
  "Dark Ales": [
    "Stout / Porter",
    "Irish Stout",
    "Brown Ale",
  ],
  "Belgian & Other": [
    "Belgian Ale",
    "Blonde / Cream Ale",
    "Balanced",
  ],
};

export default function TargetStyleModal({
  isOpen,
  onClose,
  onSelect,
  currentStyleName,
}: Props) {
  if (!isOpen) return null;

  const handleSelect = (styleName: string) => {
    onSelect(styleName);
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Select Target Water Style</h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Choose a beer style to get target water profile recommendations
          </p>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(STYLE_CATEGORIES).map(([category, styles]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {styles.map((styleName) => {
                  const target = BEER_STYLE_TARGETS[styleName];
                  if (!target) return null;

                  const isSelected = currentStyleName === styleName;

                  return (
                    <button
                      key={styleName}
                      onClick={() => handleSelect(styleName)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {styleName}
                        </div>
                        <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-1 rounded">
                          {target.clToSo4Ratio}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {target.description}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <div className="text-gray-500 dark:text-gray-400">Ca</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {target.profile.Ca}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <div className="text-gray-500 dark:text-gray-400">Cl</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {target.profile.Cl}
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <div className="text-gray-500 dark:text-gray-400">SO4</div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {target.profile.SO4}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalOverlay>
  );
}
