/**
 * WCAG contrast check for the brand colour pairings used on the site.
 * Reads the four hex values from styles/tokens.css.
 * Run: npm run check:contrast
 */
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "styles", "tokens.css"), "utf8");
const get = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`--${name} not found in styles/tokens.css`);
  return m[1]!;
};

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

const ink = get("deep-ink");
const ivory = get("soft-ivory");
const blue = get("electric-blue");
const lime = get("acid-lime");

const rows: [string, string, string, number][] = [
  ["Body text, dark mode (ivory on ink)", ivory, ink, 4.5],
  ["Body text, light mode (ink on ivory)", ink, ivory, 4.5],
  ["Link underline + chart marks, dark mode (blue on ink, non-text)", blue, ink, 3],
  ["Link underline + chart marks, light mode (blue on ivory, non-text)", blue, ivory, 3],
  ["Focus ring vs dark background (blue on ink)", blue, ink, 3],
  ["Focus ring vs light background (blue on ivory)", blue, ivory, 3],
  ["Status tag label (ink on lime)", ink, lime, 4.5],
  ["Lime tag edge vs dark background", lime, ink, 3],
  ["Lime tag edge vs light background (tag has ink text, edge is decorative)", lime, ivory, 1],
];

// Muted and faint text are the foreground mixed toward the background (see tokens.css).
const hex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (fg: string, bg: string, pct: number) => hex(rgb(fg).map((v, i) => v * pct + rgb(bg)[i]! * (1 - pct)));
const pct = (mode: "dark" | "light", token: string) => {
  const block = mode === "light" ? css.slice(css.indexOf("prefers-color-scheme: light")) : css;
  const m = block.match(new RegExp(`--${token}: color-mix\\(in srgb, var\\(--fg\\) (\\d+)%`));
  return m ? Number(m[1]) / 100 : 1;
};
for (const t of ["fg-muted", "fg-faint"]) {
  rows.push([`${t} text, dark mode`, mix(ivory, ink, pct("dark", t)), ink, 4.5]);
  rows.push([`${t} text, light mode`, mix(ink, ivory, pct("light", t)), ivory, 4.5]);
}

const onBlue = ratio(ink, blue) >= ratio(ivory, blue) ? ["deep-ink", ink] : ["soft-ivory", ivory];
rows.push([`Primary button label, 19px bold (${onBlue[0]} on blue, large text)`, onBlue[1]!, blue, 3]);

console.log(`deep-ink ${ink}  soft-ivory ${ivory}  electric-blue ${blue}  acid-lime ${lime}\n`);
let fails = 0;
for (const [name, fg, bg, min] of rows) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (needs ${min}:1)  ${name}`);
}
console.log(`\nButton labels: use --on-accent: var(--${onBlue[0]}) in styles/tokens.css (${ratio(onBlue[1]!, blue).toFixed(2)}:1).`);
console.log("Small text never uses blue or lime: links are ink/ivory with a blue underline, tags are ink on lime.");
if (/TODO\(brand\)/.test(css)) console.log("\nNote: tokens.css still has TODO(brand) placeholders. These results are for stand-in colours.");
if (fails) {
  console.log(`\n${fails} pairing(s) fail. Adjust where the colour is used (see styles/tokens.css), never the brand hex.`);
  process.exit(1);
}
