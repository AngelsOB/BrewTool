/**
 * Style Selector Modal Component
 *
 * Modal for selecting BJCP beer styles with:
 * - Search by style name or code
 * - Grouped by category
 * - Similar UX to fermentable/hop modals
 */

import { useState, useMemo } from "react";
import { getBjcpCategories } from "../../../../utils/bjcp";
import type { BjcpStyle } from "../../../../utils/bjcp";
import ModalOverlay from "./ModalOverlay";

type StyleSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (style: string) => void;
  currentStyle?: string;
};

export default function StyleSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentStyle,
}: StyleSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get all categories
  const categories = getBjcpCategories();

  // Filter categories and styles by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        styles: cat.styles.filter(
          (style) =>
            style.name.toLowerCase().includes(query) ||
            style.code.toLowerCase().includes(query) ||
            cat.name.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.styles.length > 0);
  }, [searchQuery, categories]);

  const handleSelect = (style: BjcpStyle) => {
    onSelect(`${style.code}. ${style.name}`);
    onClose();
    setSearchQuery("");
  };

  const handleClear = () => {
    onSelect("");
    onClose();
    setSearchQuery("");
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} size="3xl">
        {/* Header */}
        <div className="sticky top-0 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Select BJCP Style</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search styles by name or code..."
            className="w-full px-4 py-2 border border-[rgb(var(--border))] rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-4">
          {currentStyle && (
            <div className="mb-4 mx-6 mt-4 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Current Style:</p>
                <p className="text-blue-900 dark:text-blue-100">{currentStyle}</p>
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                Clear Style
              </button>
            </div>
          )}

          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 px-6 text-gray-500 dark:text-gray-400">
              No styles found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div key={category.code}>
                  {/* Category Header */}
                  <h3 className="text-sm font-semibold mb-2 sticky top-0 bg-[rgb(var(--card))] px-6 py-2 border-b border-[rgb(var(--border))] z-10">
                    {category.code}. {category.name}
                  </h3>

                  {/* Styles Grid */}
                  <div className="grid grid-cols-1 gap-2 px-6">
                    {category.styles.map((style) => {
                      const styleString = `${style.code}. ${style.name}`;
                      const isSelected = currentStyle === styleString;

                      return (
                        <button
                          key={style.code}
                          onClick={() => handleSelect(style)}
                          className={`text-left p-3 rounded border transition-colors ${
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-900/40 border-blue-500"
                              : "bg-[rgb(var(--bg))] border-[rgb(var(--border))] hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">{style.code}</span>
                              <span className="ml-2">{style.name}</span>
                            </div>
                            {isSelected && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[rgb(var(--bg))] border-t border-[rgb(var(--border))] px-6 py-4">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[rgb(var(--border))] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            {!currentStyle && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                No Style (Clear)
              </button>
            )}
          </div>
        </div>
    </ModalOverlay>
  );
}
