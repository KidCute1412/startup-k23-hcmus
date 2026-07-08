type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="border-b border-vanguard-light-border pb-6 dark:border-vanguard-dark-border">
      <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
