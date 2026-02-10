/**
 * Yeast Laboratory Badge Component
 *
 * Displays a yeast laboratory favicon with fallback to initial letter.
 * Used in YeastSection and YeastDisplay for consistent branding.
 */

import { getYeastLabFavicon } from "../utils/yeastLabIcons";

interface YeastLabBadgeProps {
  /** Laboratory name to display favicon for */
  laboratory?: string;
  /** Size variant - 'sm' for preset list, 'md' for selected yeast display */
  size?: "sm" | "md";
  /** Additional CSS classes */
  className?: string;
}

export default function YeastLabBadge({
  laboratory,
  size = "md",
  className = "",
}: YeastLabBadgeProps) {
  const favicon = getYeastLabFavicon(laboratory);
  const sizeClasses = size === "sm" ? "w-6 h-6" : "w-8 h-8";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  if (favicon) {
    return (
      <img
        src={favicon}
        alt={laboratory || "Yeast lab"}
        className={`${sizeClasses} rounded-md object-contain ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-md border border-[rgb(var(--border))] bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${textSize} text-gray-400 font-bold uppercase ${className}`}
    >
      {laboratory?.charAt(0) || "Y"}
    </div>
  );
}
