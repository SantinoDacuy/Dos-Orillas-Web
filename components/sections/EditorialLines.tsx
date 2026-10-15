export function EditorialLines({ lines, accentLast = false }: {
  lines: readonly string[];
  accentLast?: boolean;
}) {
  return <>{lines.map((line, index) => <span className="editorial-line-mask" key={line}>
    <span className={`editorial-line-inner${accentLast && index === lines.length - 1 ? ' editorial-line-accent' : ''}`}
      data-editorial-line>{line}</span>
  </span>)}</>;
}
