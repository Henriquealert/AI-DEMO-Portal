/**
 * The Alert "a!" mark. Rendered as a CSS mask so it takes the current text
 * colour: ivory on dark, ink on light. Source: public/brand/alert-mark.png
 * (cut from the supplied logo file, 353x390).
 */
export function AlertMark({ height = 28, className }: { height?: number; className?: string }) {
  return (
    <span
      className={className ? `alert-mark ${className}` : "alert-mark"}
      style={{ height, width: Math.round((height * 353) / 390) }}
      aria-hidden="true"
    />
  );
}
