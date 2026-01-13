/**
 * Modal Overlay Component
 *
 * Reusable modal overlay with:
 * - Backdrop blur effect
 * - Semi-transparent background
 * - Click-outside-to-close
 * - ESC key to close
 * - Prevents body scroll when open
 */

import { useEffect } from "react";

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  closeOnBackdropClick?: boolean;
}

export default function ModalOverlay({
  isOpen,
  onClose,
  children,
  size = "lg",
  closeOnBackdropClick = true,
}: ModalOverlayProps) {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  };

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-[rgb(var(--card))] rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
