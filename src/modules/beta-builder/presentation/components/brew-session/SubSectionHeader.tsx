import type { ReactNode } from 'react';

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
      {children}
    </div>
  );
}

interface SubSectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SubSectionHeader({
  title,
  actionLabel,
  onAction,
}: SubSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <SectionTitle>{title}</SectionTitle>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-xs text-blue-600 hover:text-blue-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
