/** Read-only previews for text and CSV inputs. */

export function parseCsv(src: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

const NUMERIC = /^-?\$?[\d,]+(\.\d+)?%?$/;

export function CsvTable({ csv, caption, limit = true }: { csv: string; caption: string; limit?: boolean }) {
  const [head = [], ...body] = parseCsv(csv);
  const numericCol = head.map((_, j) => body.length > 0 && body.every((r) => !r[j] || NUMERIC.test(r[j]!.trim())));
  return (
    <div className={limit ? "table-scroll limit" : "table-scroll"} tabIndex={0} role="region" aria-label={caption}>
      <table className="data-table nowrap">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((h, j) => (
              <th key={j} scope="col" className={numericCol[j] ? "r" : undefined}>
                {h.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, i) => (
            <tr key={i}>
              {head.map((_, j) => (
                <td key={j} className={numericCol[j] ? "r" : undefined}>
                  {r[j] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TextPreview({ text, caption, wrap = false }: { text: string; caption: string; wrap?: boolean }) {
  return (
    <pre className={wrap ? "doc-preview wrap-text" : "doc-preview"} tabIndex={0} aria-label={caption}>
      {text}
    </pre>
  );
}
