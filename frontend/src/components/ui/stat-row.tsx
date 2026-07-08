type StatRowProps = {
  label: string;
  value: string;
};

export function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-vanguard-light-border py-3 text-sm last:border-b-0 dark:border-vanguard-dark-border">
      <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        {label}
      </span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
