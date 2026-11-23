/**
 * Validates every demo folder: demo.json against the schema, referenced files
 * exist, and every sample output matches the shared block schema.
 * Run: npm run check:content
 */
import fs from "node:fs";
import path from "node:path";
import { demoConfigSchema, isFullDemo } from "../lib/schema.ts";
import { BLOCKS_JSON_SCHEMA } from "../lib/blocks.ts";

type Schema = {
  type?: string;
  enum?: unknown[];
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  anyOf?: Schema[];
};

function validate(value: unknown, schema: Schema, at: string): string[] {
  if (schema.anyOf) {
    const results = schema.anyOf.map((s) => validate(value, s, at));
    if (results.some((r) => r.length === 0)) return [];
    const type = (value as { type?: string })?.type;
    const match = schema.anyOf.findIndex((s) => s.properties?.type?.enum?.[0] === type);
    return match >= 0 ? results[match]! : [`${at}: unknown block type "${type}"`];
  }
  if (schema.enum && !schema.enum.includes(value)) return [`${at}: ${JSON.stringify(value)} not in ${schema.enum.join("|")}`];
  switch (schema.type) {
    case "string":
      return typeof value === "string" ? [] : [`${at}: expected string`];
    case "number":
      return typeof value === "number" && Number.isFinite(value) ? [] : [`${at}: expected number`];
    case "boolean":
      return typeof value === "boolean" ? [] : [`${at}: expected boolean`];
    case "array":
      if (!Array.isArray(value)) return [`${at}: expected array`];
      return value.flatMap((v, i) => validate(v, schema.items!, `${at}[${i}]`));
    case "object": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) return [`${at}: expected object`];
      const obj = value as Record<string, unknown>;
      const errs: string[] = [];
      for (const k of schema.required ?? []) if (!(k in obj)) errs.push(`${at}: missing "${k}"`);
      for (const k of Object.keys(obj)) {
        if (!schema.properties?.[k]) errs.push(`${at}: unexpected "${k}"`);
        else errs.push(...validate(obj[k], schema.properties[k]!, `${at}.${k}`));
      }
      return errs;
    }
  }
  return [];
}

const root = path.join(process.cwd(), "content", "demos");
let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.error("  ✗ " + msg);
};

for (const slug of fs.readdirSync(root).sort()) {
  const dir = path.join(root, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  console.log(slug);
  let config;
  try {
    config = demoConfigSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, "demo.json"), "utf8")));
  } catch (e) {
    fail(`demo.json: ${(e as Error).message}`);
    continue;
  }
  if (config.slug !== slug) fail(`slug "${config.slug}" does not match folder name`);
  if (!isFullDemo(config)) {
    console.log("  coming soon placeholder");
    continue;
  }
  const files = [config.live.prompt, ...config.context.map((c) => c.file), ...config.samples.flatMap((s) => [s.input, s.output])];
  for (const f of files) if (!fs.existsSync(path.join(dir, f))) fail(`missing file ${f}`);
  for (const s of config.samples) {
    const p = path.join(dir, s.output);
    if (!fs.existsSync(p)) continue;
    const input = fs.readFileSync(path.join(dir, s.input), "utf8");
    if (input.length > config.tryIt.maxChars) fail(`${s.input} is longer than tryIt.maxChars (${input.length} > ${config.tryIt.maxChars})`);
    try {
      const errs = validate(JSON.parse(fs.readFileSync(p, "utf8")), BLOCKS_JSON_SCHEMA as Schema, s.output);
      errs.forEach(fail);
    } catch (e) {
      fail(`${s.output}: ${(e as Error).message}`);
    }
  }
  for (const v of [config.spec.manualTime, config.spec.withTool]) {
    if (v !== "TODO") console.log(`  note: time figure "${v}" is set. Make sure it is measured, not estimated.`);
  }
  console.log(`  ${config.samples.length} samples ok`);
}

if (errors) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log("\nAll demo content is valid.");
