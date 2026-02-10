interface InfoPillProps {
  text: string;
}

export function InfoPill({ text }: InfoPillProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 px-2.5 py-1 text-xs font-medium">
      {text}
    </span>
  );
}
