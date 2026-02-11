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
    <ModalOverlay isOpen={isOpen} onClose={onClose} size="3xl">
        {/* Header */}
        <div className="border-b border-[rgb(var(--brew-border-subtle))] px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Select Target Water Style</h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-[var(--fg-muted)] hover:text-[var(--fg-strong)] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-muted mt-2">
            Choose a beer style to get target water profile recommendations
          </p>
        </div>

        <div className="px-6 py-4 space-y-6 overflow-y-auto">
          {Object.entries(STYLE_CATEGORIES).map(([category, styles]) => (
            <div key={category}>
              <h3 className="text-sm font-bold uppercase mb-3 text-muted" style={{ letterSpacing: 'var(--brew-tracking-wide)' }}>
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
                      className={`text-left p-4 rounded-lg transition-all duration-150 ${
                        isSelected
                          ? "brew-chip-active"
                          : "brew-ingredient-row"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold">
                          {styleName}
                        </div>
                        <span className="brew-tag text-[10px]">
                          {target.clToSo4Ratio}
                        </span>
                      </div>
                      <p className="text-sm text-muted mb-3">
                        {target.description}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="brew-gauge p-2 rounded-lg">
                          <div className="text-muted text-[10px]">Ca</div>
                          <div className="font-semibold">{target.profile.Ca}</div>
                        </div>
                        <div className="brew-gauge p-2 rounded-lg">
                          <div className="text-muted text-[10px]">Cl</div>
                          <div className="font-semibold">{target.profile.Cl}</div>
                        </div>
                        <div className="brew-gauge p-2 rounded-lg">
                          <div className="text-muted text-[10px]">SO4</div>
                          <div className="font-semibold">{target.profile.SO4}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
    </ModalOverlay>
  );
}
