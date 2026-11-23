/** Fictional company mark (inline SVG from content/demos/<slug>/logo.svg). */
export function CompanyLogo({ svg, size = 20 }: { svg?: string; size?: number }) {
  if (!svg) return null;
  return (
    <span
      className="co-logo"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
