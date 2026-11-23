import type { ChartBlock } from "@/lib/blocks";

/**
 * Single-series bar or line chart in plain SVG.
 * One colour (Electric Blue) so no legend: the title names the series.
 * Hover or keyboard focus on a mark shows its value; the full data is in a
 * table under the chart.
 */

const W = 640;
const H = 260;
const M = { top: 20, right: 12, bottom: 30, left: 56 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * exp;
}

export function formatValue(v: number, unit: string) {
  const decimals = Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 1 : 0;
  const n = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (unit === "$") return `$${n}`;
  if (unit === "%") return `${n}%`;
  return unit ? `${n} ${unit}` : n;
}

function shortValue(v: number, unit: string) {
  if (Math.abs(v) >= 1000) {
    const k = (v / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 });
    return unit === "$" ? `$${k}k` : `${k}k`;
  }
  return formatValue(v, unit);
}

export function Chart({ block, id }: { block: ChartBlock; id: string }) {
  const pts = block.points;
  const max = niceMax(Math.max(0, ...pts.map((p) => p.value)));
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const y = (v: number) => M.top + ih - (v / max) * ih;
  const band = iw / Math.max(1, pts.length);
  const cx = (i: number) => M.left + band * i + band / 2;
  const barW = Math.min(48, band * 0.56);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const maxIdx = pts.reduce((m, p, i) => (p.value > pts[m]!.value ? i : m), 0);
  const titleId = `${id}-title`;

  return (
    <figure className="chart">
      <figcaption id={titleId} className="label">
        {block.title}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-labelledby={titleId}>
        {ticks.map((t) => (
          <g key={t}>
            <line className={t === 0 ? "axis-line" : "grid-line"} x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
            <text className="tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {shortValue(t, block.unit)}
            </text>
          </g>
        ))}

        {block.kind === "line" && pts.length > 1 && (
          <polyline className="mark-line" points={pts.map((p, i) => `${cx(i)},${y(p.value)}`).join(" ")} />
        )}

        {pts.map((p, i) => {
          const label = `${p.label}: ${formatValue(p.value, block.unit)}`;
          const tipW = Math.max(70, label.length * 6.4 + 16);
          const tipX = Math.min(Math.max(cx(i) - tipW / 2, M.left), W - M.right - tipW);
          const tipY = Math.max(0, y(p.value) - 34);
          return (
            <g key={p.label + i} className="pt" tabIndex={0} aria-label={label} role="img">
              <rect className="hit" x={M.left + band * i} y={M.top} width={band} height={ih} />
              <line className="hover-rule" x1={cx(i)} x2={cx(i)} y1={M.top} y2={M.top + ih} stroke="transparent" />
              {block.kind === "bar" ? (
                <rect className="mark" x={cx(i) - barW / 2} y={y(p.value)} width={barW} height={Math.max(0, M.top + ih - y(p.value))} />
              ) : (
                <circle className="mark-dot mark" cx={cx(i)} cy={y(p.value)} r={4.5} />
              )}
              {i === maxIdx && (
                <text className="value-label" x={cx(i)} y={y(p.value) - 8} textAnchor="middle">
                  {shortValue(p.value, block.unit)}
                </text>
              )}
              <text className="tick" x={cx(i)} y={H - M.bottom + 18} textAnchor="middle">
                {p.label.length > 12 ? p.label.slice(0, 11) + "…" : p.label}
              </text>
              <g className="tooltip">
                <rect x={tipX} y={tipY} width={tipW} height={22} />
                <text x={tipX + 8} y={tipY + 15}>
                  {label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      {block.note && <p className="chart-note">{block.note}</p>}
      <details className="ref">
        <summary>
          <span className="label label-muted">Data table</span>
        </summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col" className="r">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {pts.map((p, i) => (
                <tr key={p.label + i}>
                  <td>{p.label}</td>
                  <td className="r">{formatValue(p.value, block.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
