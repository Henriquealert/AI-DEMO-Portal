/**
 * Output format shared by every demo.
 *
 * A demo result is a list of blocks. Sample outputs stored in
 * content/demos/<slug>/outputs/*.json use this shape, and live mode asks
 * Claude to return the same shape (see BLOCKS_JSON_SCHEMA below), so one set
 * of renderers covers every demo.
 *
 * Every property is required so the same definition works as a Claude
 * structured-output schema. Use "" or [] for "nothing to show".
 */

export type Status = "ok" | "warn" | "error" | "none";

export type HeadingBlock = { type: "heading"; text: string };

/** Paragraphs separated by a blank line. */
export type TextBlock = { type: "text"; text: string };

/** Label / value pairs, e.g. invoice header or CRM fields. */
export type FieldsBlock = {
  type: "fields";
  title: string;
  items: { label: string; value: string; status: Status }[];
};

export type TableBlock = {
  type: "table";
  title: string;
  columns: { label: string; align: "left" | "right" }[];
  rows: { cells: string[]; status: Status; note: string }[];
  footer: { label: string; value: string; status: Status }[];
};

/** Validation results: mismatches, missing data, passed checks. */
export type ChecksBlock = {
  type: "checks";
  title: string;
  items: { status: Status; text: string }[];
};

export type ListBlock = {
  type: "list";
  title: string;
  ordered: boolean;
  items: { text: string; owner: string; due: string }[];
};

export type EmailBlock = {
  type: "email";
  title: string;
  to: string;
  subject: string;
  body: string;
};

/** One triaged inbox message with its summary and draft reply. */
export type MessageBlock = {
  type: "message";
  from: string;
  subject: string;
  received: string;
  priority: "high" | "normal" | "low";
  topic: string;
  summary: string;
  draft: string;
};

export type AnswerBlock = {
  type: "answer";
  question: string;
  answer: string;
  citations: { section: string; title: string; quote: string }[];
};

export type ChartBlock = {
  type: "chart";
  title: string;
  kind: "bar" | "line";
  unit: string;
  points: { label: string; value: number }[];
  note: string;
};

export type Block =
  | HeadingBlock
  | TextBlock
  | FieldsBlock
  | TableBlock
  | ChecksBlock
  | ListBlock
  | EmailBlock
  | MessageBlock
  | AnswerBlock
  | ChartBlock;

export type DemoOutput = { blocks: Block[] };

/* ------------------------------------------------------------------ */
/* JSON Schema for Claude structured outputs (live mode).              */
/* ------------------------------------------------------------------ */

const str = { type: "string" } as const;
const status = { type: "string", enum: ["ok", "warn", "error", "none"] } as const;

function obj(properties: Record<string, unknown>) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function arr(items: unknown) {
  return { type: "array", items };
}

function constType(t: string) {
  return { type: "string", enum: [t] };
}

export const BLOCKS_JSON_SCHEMA = obj({
  blocks: arr({
    anyOf: [
      obj({ type: constType("heading"), text: str }),
      obj({ type: constType("text"), text: str }),
      obj({
        type: constType("fields"),
        title: str,
        items: arr(obj({ label: str, value: str, status })),
      }),
      obj({
        type: constType("table"),
        title: str,
        columns: arr(obj({ label: str, align: { type: "string", enum: ["left", "right"] } })),
        rows: arr(obj({ cells: arr(str), status, note: str })),
        footer: arr(obj({ label: str, value: str, status })),
      }),
      obj({
        type: constType("checks"),
        title: str,
        items: arr(obj({ status, text: str })),
      }),
      obj({
        type: constType("list"),
        title: str,
        ordered: { type: "boolean" },
        items: arr(obj({ text: str, owner: str, due: str })),
      }),
      obj({ type: constType("email"), title: str, to: str, subject: str, body: str }),
      obj({
        type: constType("message"),
        from: str,
        subject: str,
        received: str,
        priority: { type: "string", enum: ["high", "normal", "low"] },
        topic: str,
        summary: str,
        draft: str,
      }),
      obj({
        type: constType("answer"),
        question: str,
        answer: str,
        citations: arr(obj({ section: str, title: str, quote: str })),
      }),
      obj({
        type: constType("chart"),
        title: str,
        kind: { type: "string", enum: ["bar", "line"] },
        unit: str,
        points: arr(obj({ label: str, value: { type: "number" } })),
        note: str,
      }),
    ],
  }),
});
