/**
 * PresetPickerModal Component
 *
 * A reusable modal shell for selecting items from a preset database.
 * Used by FermentableSection, HopSection, and YeastSection.
 *
 * Features:
 * - Accessible modal with focus trapping via ModalOverlay
 * - Search input with autofocus
 * - Collapsible advanced filters section
 * - Scrollable grouped preset list
 * - Footer with count and custom creation button
 */

import { useId } from "react";
import ModalOverlay from "./ModalOverlay";

interface PresetGroup<T> {
  label: string;
  items: T[];
}

interface PresetPickerModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filterContent?: React.ReactNode;
  groups: PresetGroup<T>[];
  isLoading: boolean;
  emptyMessage: string;
  renderItem: (item: T, group: PresetGroup<T>) => React.ReactNode;
  totalCount: number;
  countLabel: string;
  onCreateCustom: () => void;
  /** Color scheme for accent elements: 'blue' | 'green' | 'amber' */
  colorScheme?: "blue" | "green" | "amber";
  /** Additional content to render outside the modal (e.g., portaled tooltips) */
  portalContent?: React.ReactNode;
}

const filterIconSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export default function PresetPickerModal<T>({
  isOpen,
  onClose,
  title,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filterContent,
  groups,
  isLoading,
  emptyMessage,
  renderItem,
  totalCount,
  countLabel,
  onCreateCustom,
  colorScheme = "blue",
  portalContent,
}: PresetPickerModalProps<T>) {
  const titleId = useId();

  // Color scheme classes - focus rings use consistent coral-600 theme color
  const colorClasses = {
    blue: {
      filterActive:
        "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700",
      focusRing: "focus:ring-[var(--coral-600)] focus:border-[var(--coral-600)]",
    },
    green: {
      filterActive:
        "bg-green-100 text-green-600 border-green-300 dark:bg-green-900/60 dark:text-green-200 dark:border-green-700",
      focusRing: "focus:ring-[var(--coral-600)] focus:border-[var(--coral-600)]",
    },
    amber: {
      filterActive:
        "bg-amber-100 text-amber-600 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700",
      focusRing: "focus:ring-[var(--coral-600)] focus:border-[var(--coral-600)]",
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <>
      <ModalOverlay
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        labelledById={titleId}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[rgb(var(--border))]">
          <div className="flex justify-between items-center mb-4">
            <h3 id={titleId} className="text-xl font-semibold">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`flex-1 px-4 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 ${colors.focusRing}`}
              autoFocus
            />
            {filterContent && (
              <button
                onClick={onToggleFilters}
                className={`px-3 py-2 rounded-md border transition-colors ${
                  showFilters
                    ? colors.filterActive
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                }`}
                title="Toggle Filters"
                aria-expanded={showFilters}
                aria-label="Toggle filters"
              >
                {filterIconSvg}
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && filterContent && (
            <div className="space-y-3 mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {filterContent}
            </div>
          )}
        </div>

        {/* Modal Body - Scrollable List */}
        <div className="flex-1 overflow-y-auto pb-4">
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400 px-6 py-8">
              Loading presets...
            </p>
          ) : groups.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 px-6 py-8 text-center">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <h4 className="text-sm font-semibold mb-2 uppercase sticky top-0 z-10 bg-[rgb(var(--card))] px-6 py-2 border-b border-[rgb(var(--border))]">
                    {group.label}
                  </h4>
                  <div className="space-y-1 px-6">
                    {group.items.map((item, index) => (
                      <div key={index}>{renderItem(item, group)}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))] flex justify-between items-center">
          <div className="text-sm">
            {totalCount} {countLabel}
          </div>
          <button
            onClick={onCreateCustom}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            + Create Custom
          </button>
        </div>
      </ModalOverlay>

      {/* Portal content (e.g., tooltips) rendered outside the modal */}
      {isOpen && portalContent}
    </>
  );
}
