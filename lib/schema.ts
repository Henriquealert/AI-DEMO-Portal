import { z } from "zod";

export const CATEGORIES = [
  "DOCUMENTS",
  "SALES",
  "COMMUNICATION",
  "KNOWLEDGE",
  "REPORTING",
  "PRIVATE AI",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function categoryId(c: Category) {
  return c.toLowerCase().replace(/\s+/g, "-");
}

const fileRef = z.string().regex(/^[\w./-]+$/, "Use a relative path inside the demo folder");

const placeholderSchema = z.object({
  comingSoon: z.literal(true),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(CATEGORIES),
  order: z.number(),
  stack: z.array(z.object({ name: z.string(), role: z.string() })).default([]),
});

const fullSchema = z.object({
  comingSoon: z.literal(false).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  description: z.string(),
  category: z.enum(CATEGORIES),
  status: z.enum(["SAMPLE", "NEW", "BETA"]),
  order: z.number(),
  company: z.object({ name: z.string(), industry: z.string() }),
  spec: z.object({
    input: z.string(),
    output: z.string(),
    whereItRuns: z.string(),
    manualTime: z.string(),
    withTool: z.string(),
  }),
  problem: z.string(),
  steps: z.array(z.object({ label: z.string(), text: z.string() })).length(4),
  stack: z.array(z.object({ name: z.string(), role: z.string() })).min(1),
  tryIt: z.object({
    inputLabel: z.string(),
    inputFormat: z.enum(["text", "csv"]),
    placeholder: z.string(),
    maxChars: z.number().int().positive().max(20000),
    acceptUpload: z.boolean(),
  }),
  context: z
    .array(z.object({ label: z.string(), file: fileRef, format: z.enum(["text", "csv"]) }))
    .default([]),
  samples: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        label: z.string(),
        input: fileRef,
        output: fileRef,
      }),
    )
    .min(1),
  live: z.object({ enabled: z.boolean(), prompt: fileRef }),
});

export const demoConfigSchema = z.union([placeholderSchema, fullSchema]);

export type PlaceholderConfig = z.infer<typeof placeholderSchema>;
export type DemoConfig = z.infer<typeof fullSchema>;
export type AnyDemoConfig = PlaceholderConfig | DemoConfig;

export function isFullDemo(d: AnyDemoConfig): d is DemoConfig {
  return d.comingSoon !== true;
}
