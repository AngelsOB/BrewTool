import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Button variants map to CSS classes in index.css and inline Tailwind patterns.
 * - neon: Primary CTA with coral glow (uses .btn-neon)
 * - outline: Secondary action with coral border (uses .btn-outline)
 * - tonal: Soft tertiary button (uses .btn-tonal)
 * - danger: Destructive action (red)
 * - ghost: Minimal, text-only appearance
 * - link: Underlined text link style
 */
export type ButtonVariant =
  | "neon"
  | "outline"
  | "tonal"
  | "danger"
  | "ghost"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon to show before children */
  leftIcon?: ReactNode;
  /** Icon to show after children */
  rightIcon?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Uses CSS class from index.css
  neon: "btn-neon",
  outline: "btn-outline",
  tonal: "btn-tonal",
  // Inline Tailwind patterns for variants not in CSS
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition text-[var(--fg-strong)] hover:bg-[color-mix(in_oklch,var(--fg-strong)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-600)] focus-visible:ring-offset-2",
  link: "inline-flex items-center gap-1 font-medium underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
};

// Size classes - btn-neon/outline/tonal have their own padding, so we only add size for inline variants
const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

// Size overrides for CSS-based variants (they have base padding, we just adjust)
const cssSizeOverrides: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "",
  lg: "px-5 py-2.5 text-base",
};

const disabledClasses = "opacity-50 cursor-not-allowed pointer-events-none";

/**
 * Shared Button component that standardizes button styling across the app.
 *
 * @example
 * // Primary CTA
 * <Button variant="neon">Start Recipe</Button>
 *
 * // Secondary action
 * <Button variant="outline" size="sm">Cancel</Button>
 *
 * // Danger button with icon
 * <Button variant="danger" leftIcon={<TrashIcon />}>Delete</Button>
 *
 * // Full width
 * <Button variant="neon" fullWidth>Submit</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "neon",
      size = "md",
      leftIcon,
      rightIcon,
      fullWidth = false,
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const isCssVariant = variant === "neon" || variant === "outline" || variant === "tonal";

    // Build class string
    const classes = [
      variantClasses[variant],
      isCssVariant ? cssSizeOverrides[size] : sizeClasses[size],
      fullWidth && "w-full justify-center",
      isDisabled && disabledClasses,
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
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

/** Simple loading spinner for button loading state */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
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

export default Button;
