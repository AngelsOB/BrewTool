import type { ReactNode } from 'react';

export type SectionTone = 'blue' | 'amber' | 'emerald' | 'slate';

interface SectionCardProps {
  title: string;
  description?: string;
  tone?: SectionTone;
  children: ReactNode;
}

const TONE_STYLES: Record<SectionTone, string> = {
  blue: 'border-t-blue-500/60 bg-blue-50/30 dark:bg-blue-950/10',
  amber: 'border-t-amber-400/70 bg-amber-50/40 dark:bg-amber-950/10',
  emerald: 'border-t-emerald-500/60 bg-emerald-50/30 dark:bg-emerald-950/10',
  slate: 'border-t-slate-300/70 bg-white/80 dark:bg-gray-900/40',
};

export function SectionCard({
  title,
  description,
  tone = 'slate',
  children,
}: SectionCardProps) {
  return (
    <div
      className={`rounded-xl border border-[rgb(var(--border))] border-t-4 p-5 shadow-sm ${TONE_STYLES[tone]}`}
    >
      <div className="mb-4">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</div>
        {description && <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>}
      </div>
      {children}
    </div>
  );
}
