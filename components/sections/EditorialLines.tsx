export function EditorialLines({ lines, accentLast = false, accentIndex }: {
  lines: readonly string[];
  accentLast?: boolean;
  accentIndex?: number;
}) {
  return <>{lines.map((line, index) => {
    const isAccent = (accentLast && index === lines.length - 1) || (accentIndex !== undefined && index === accentIndex);
    return <span className="editorial-line-mask" key={line}>
      <span className={`editorial-line-inner${isAccent ? ' editorial-line-accent radiant-serif-highlight' : ''}`}
        data-editorial-line>{line}</span>
    </span>;
  })}</>;
}
