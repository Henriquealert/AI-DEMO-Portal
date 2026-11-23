import type { Block, Status } from "@/lib/blocks";
import { Chart } from "./Chart";

const STATUS_TEXT: Record<Status, string> = { ok: "OK", warn: "Check", error: "Issue", none: "" };

function StatusMark({ status }: { status: Status }) {
  if (status === "none") return null;
  return <span className={`st st-${status}`}>{STATUS_TEXT[status]}</span>;
}

function Title({ text }: { text: string }) {
  if (!text) return null;
  return <h3 className="label label-muted out-title">{text}</h3>;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </>
  );
}

function BlockView({ block, id }: { block: Block; id: string }) {
  switch (block.type) {
    case "heading":
      return <h3 className="h3">{block.text}</h3>;

    case "text":
      return (
        <div className="out-text">
          <Paragraphs text={block.text} />
        </div>
      );

    case "fields":
      return (
        <div>
          <Title text={block.title} />
          <dl className="fields">
            {block.items.map((f, i) => (
              <div key={i}>
                <dt>{f.label}</dt>
                <dd>
                  <span>{f.value}</span>
                  <StatusMark status={f.status} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );

    case "table": {
      const cols = block.columns.length;
      const hasStatus = block.rows.some((r) => r.status !== "none");
      return (
        <div>
          <Title text={block.title} />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {block.columns.map((c, i) => (
                    <th key={i} scope="col" className={c.align === "right" ? "r" : undefined}>
                      {c.label}
                    </th>
                  ))}
                  {hasStatus && (
                    <th scope="col">
                      <span className="sr-only">Status</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((r, i) => (
                  <tr key={i} className={r.status === "error" ? "row-error" : undefined}>
                    {r.cells.map((cell, j) => (
                      <td key={j} className={block.columns[j]?.align === "right" ? "r" : undefined}>
                        {cell}
                        {j === 1 && r.note && <span className="row-note">{r.note}</span>}
                        {j !== 1 && cols < 2 && r.note && <span className="row-note">{r.note}</span>}
                      </td>
                    ))}
                    {hasStatus && (
                      <td>
                        <StatusMark status={r.status} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {block.footer.length > 0 && (
                <tbody className="tfoot">
                  {block.footer.map((f, i) => (
                    <tr key={i}>
                      <td colSpan={Math.max(1, cols - 1)} className="r">
                        {f.label}
                      </td>
                      <td className="r">{f.value}</td>
                      {hasStatus && (
                        <td>
                          <StatusMark status={f.status} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>
      );
    }

    case "checks":
      return (
        <div>
          <Title text={block.title} />
          <ul className="checks">
            {block.items.map((c, i) => (
              <li key={i}>
                <StatusMark status={c.status === "none" ? "ok" : c.status} />
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <div>
          <Title text={block.title} />
          <Tag className="actions">
            {block.items.map((it, i) => (
              <li key={i}>
                <span>{it.text}</span>
                <span className="meta">{it.owner && <>Owner: {it.owner}</>}</span>
                <span className="meta">{it.due && <>Due: {it.due}</>}</span>
              </li>
            ))}
          </Tag>
        </div>
      );
    }

    case "email":
      return (
        <div>
          <Title text={block.title} />
          <div className="email">
            <dl>
              <dt>To</dt>
              <dd>{block.to}</dd>
              <dt>Subject</dt>
              <dd>{block.subject}</dd>
            </dl>
            <div className="email-body">{block.body}</div>
          </div>
        </div>
      );

    case "message":
      return (
        <div className="msg">
          <details>
            <summary>
              <span className={`st ${block.priority === "high" ? "st-error" : block.priority === "normal" ? "st-warn" : "st-ok"}`}>
                {block.priority}
              </span>
              <span>
                <span className="msg-subject">{block.subject}</span>
                <br />
                <span className="msg-from">
                  {block.from} · {block.received}
                </span>
              </span>
              <span className="msg-topic">{block.topic}</span>
              <span className="msg-toggle" aria-hidden="true" />
            </summary>
            <div className="msg-body">
              <p>
                <strong>Summary. </strong>
                {block.summary}
              </p>
              <div>
                <p className="label label-muted" style={{ marginBottom: 6 }}>
                  Draft reply (not sent)
                </p>
                <div className="draft">{block.draft}</div>
              </div>
            </div>
          </details>
        </div>
      );

    case "answer":
      return (
        <div className="answer">
          <p className="answer-q">{block.question}</p>
          <div className="answer-a">
            <Paragraphs text={block.answer} />
          </div>
          {block.citations.length > 0 && (
            <div>
              <Title text="Sources" />
              <ul className="cites">
                {block.citations.map((c, i) => (
                  <li key={i}>
                    <strong>§ {c.section}</strong>
                    <div>
                      {c.title}
                      {c.quote && <blockquote>“{c.quote}”</blockquote>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case "chart":
      return <Chart block={block} id={id} />;

    default:
      return null;
  }
}

export function OutputBlocks({ blocks, idPrefix }: { blocks: Block[]; idPrefix: string }) {
  // Consecutive message blocks render as one list.
  const out: React.ReactNode[] = [];
  let msgs: React.ReactNode[] = [];
  const flush = (key: string) => {
    if (msgs.length) {
      out.push(
        <ul key={key} className="msg-list" style={{ listStyle: "none" }}>
          {msgs}
        </ul>,
      );
      msgs = [];
    }
  };
  blocks.forEach((b, i) => {
    if (b.type === "message") {
      msgs.push(
        <li key={i}>
          <BlockView block={b} id={`${idPrefix}-${i}`} />
        </li>,
      );
    } else {
      flush(`m${i}`);
      out.push(<BlockView key={i} block={b} id={`${idPrefix}-${i}`} />);
    }
  });
  flush("m-end");
  return <div className="out">{out}</div>;
}
