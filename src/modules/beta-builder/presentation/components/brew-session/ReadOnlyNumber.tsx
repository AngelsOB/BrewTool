interface ReadOnlyNumberProps {
  value: number | undefined;
  format?: (value: number) => string;
  suffix?: string;
  placeholder?: string;
  className?: string;
}

export function ReadOnlyNumber({
  value,
  format,
  suffix,
  placeholder = '—',
  className = '',
}: ReadOnlyNumberProps) {
  const displayValue =
    value === undefined
      ? placeholder
      : `${format ? format(value) : value}${suffix ?? ''}`;

  return <span className={className}>{displayValue}</span>;
}
