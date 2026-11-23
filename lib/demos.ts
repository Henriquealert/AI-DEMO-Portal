import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import {
  CATEGORIES,
  demoConfigSchema,
  isFullDemo,
  type AnyDemoConfig,
  type Category,
  type DemoConfig,
} from "./schema";
import type { DemoOutput } from "./blocks";

export const DEMOS_DIR = path.join(process.cwd(), "content", "demos");

function readDemoFile(slug: string, rel: string) {
  const base = path.join(DEMOS_DIR, slug);
  const full = path.resolve(base, rel);
  if (!full.startsWith(base + path.sep)) throw new Error(`Path escapes demo folder: ${rel}`);
  return fs.readFileSync(full, "utf8");
}

/** All demos (including coming-soon placeholders), validated, sorted by category then order. */
export const getAllDemos = cache((): AnyDemoConfig[] => {
  const slugs = fs
    .readdirSync(DEMOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const demos = slugs.map((slug) => {
    const raw = JSON.parse(readDemoFile(slug, "demo.json"));
    const parsed = demoConfigSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`content/demos/${slug}/demo.json is invalid:\n${parsed.error.message}`);
    }
    if (parsed.data.slug !== slug) {
      throw new Error(`content/demos/${slug}/demo.json: slug must match the folder name`);
    }
    return parsed.data;
  });

  return demos.sort(
    (a, b) =>
      CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
      a.order - b.order ||
      a.title.localeCompare(b.title),
  );
});

export function getDemo(slug: string): DemoConfig | undefined {
  const d = getAllDemos().find((x) => x.slug === slug);
  return d && isFullDemo(d) ? d : undefined;
}

export function getDemosByCategory() {
  const all = getAllDemos();
  return CATEGORIES.map((category: Category) => ({
    category,
    demos: all.filter((d) => d.category === category),
  })).filter((g) => g.demos.length > 0);
}

export type LoadedSample = {
  id: string;
  label: string;
  input: string;
  output: DemoOutput;
};

export function loadSamples(demo: DemoConfig): LoadedSample[] {
  return demo.samples.map((s) => ({
    id: s.id,
    label: s.label,
    input: readDemoFile(demo.slug, s.input),
    output: JSON.parse(readDemoFile(demo.slug, s.output)) as DemoOutput,
  }));
}

export type LoadedContext = { label: string; format: "text" | "csv"; content: string };

export function loadContext(demo: DemoConfig): LoadedContext[] {
  return demo.context.map((c) => ({
    label: c.label,
    format: c.format,
    content: readDemoFile(demo.slug, c.file),
  }));
}

export function loadPrompt(demo: DemoConfig): string {
  return readDemoFile(demo.slug, demo.live.prompt);
}

/**
 * Inline SVG for a demo's fictional company logo (or undefined).
 * Logos are repo content; this still rejects scripts and event handlers.
 */
export function loadCompanyLogo(demo: AnyDemoConfig): string | undefined {
  if (!isFullDemo(demo) || !demo.company.logo) return undefined;
  const svg = readDemoFile(demo.slug, demo.company.logo).trim();
  if (!svg.startsWith("<svg") || /<script|\son\w+=|javascript:|<foreignObject/i.test(svg)) {
    throw new Error(`content/demos/${demo.slug}/${demo.company.logo} is not a plain SVG`);
  }
  return svg;
}

export function loadAllCompanyLogos(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of getAllDemos()) {
    const svg = loadCompanyLogo(d);
    if (svg) out[d.slug] = svg;
  }
  return out;
}
