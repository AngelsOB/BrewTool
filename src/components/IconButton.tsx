import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type IconButtonVariant = "ghost" | "danger" | "subtle";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon to display - required for icon buttons */
  icon: ReactNode;
  /** Accessible label - required for icon-only buttons */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Loading state */
  loading?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    "text-[var(--fg-muted)] hover:text-[var(--fg-strong)] hover:bg-[color-mix(in_oklch,var(--fg-strong)_10%,transparent)] focus-visible:ring-[var(--coral-600)]",
  danger:
    "text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 focus-visible:ring-red-500",
  subtle:
    "text-[var(--fg-muted)] hover:text-[var(--fg-strong)] focus-visible:ring-[var(--coral-600)]",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "p-1 rounded-md",
  md: "p-2 rounded-lg",
  lg: "p-3 rounded-xl",
};

const iconSizeClasses: Record<IconButtonSize, string> = {
  sm: "[&>svg]:w-4 [&>svg]:h-4",
  md: "[&>svg]:w-5 [&>svg]:h-5",
  lg: "[&>svg]:w-6 [&>svg]:h-6",
};

/**
 * Icon-only button with required aria-label for accessibility.
 *
 * Use this for buttons that only contain an icon (like delete × buttons,
 * theme toggles, menu buttons, etc.).
 *
 * @example
 * <IconButton
 *   icon={<XIcon />}
 *   aria-label="Remove fermentable"
 *   variant="danger"
 *   onClick={handleRemove}
 * />
 *
 * @example
 * <IconButton
 *   icon={<MenuIcon />}
 *   aria-label="Open menu"
 *   size="lg"
 * />
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      "aria-label": ariaLabel,
      variant = "ghost",
      size = "md",
      loading = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classes = [
      "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      variantClasses[variant],
      sizeClasses[size],
      iconSizeClasses[size],
      isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={classes}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? <LoadingSpinner size={size} /> : icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

function LoadingSpinner({ size }: { size: IconButtonSize }) {
  const sizeMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };
  return (
    <svg
      className={`animate-spin ${sizeMap[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default IconButton;
