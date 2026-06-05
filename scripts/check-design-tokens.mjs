#!/usr/bin/env node
/**
 * Fails CI when hardcoded colors or non-semantic styling appears outside allowlisted files.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const ALLOWLIST = new Set([
  "src/styles/tokens.css",
  "src/components/NeevLanding.tsx", // Google OAuth brand mock
  "src/components/NeevMap.tsx", // SVG map visualization
  "src/components/ui/chart.tsx", // Recharts theme config
]);

const HEX_RE = /(?<![&\w])#[0-9A-Fa-f]{3,8}\b/g;
const ARBITRARY_TEXT_RE = /text-\[\d+px\]/g;
const FORBIDDEN_COLOR_RE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:white|black)\b/g;
const DARK_UTILITY_RE = /\bdark:/g;
const RAW_SLATE_RE =
  /\b(?:bg|text|border)-slate-\d{2,3}\b/g;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(ROOT, path).replace(/\\/g, "/");
    if (rel.includes("node_modules") || rel.startsWith("dist/")) continue;
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(tsx?|css)$/.test(entry)) files.push(rel);
  }
  return files;
}

const violations = [];

for (const file of walk(SRC)) {
  if (ALLOWLIST.has(file)) continue;
  const content = readFileSync(join(ROOT, file), "utf8");
  const hex = content.match(HEX_RE) ?? [];
  const text = content.match(ARBITRARY_TEXT_RE) ?? [];
  const forbidden = content.match(FORBIDDEN_COLOR_RE) ?? [];
  const dark = content.match(DARK_UTILITY_RE) ?? [];
  const slate = content.match(RAW_SLATE_RE) ?? [];

  if (hex.length || text.length || forbidden.length || dark.length || slate.length) {
    violations.push({
      file,
      hex: [...new Set(hex)],
      text: [...new Set(text)],
      forbidden: [...new Set(forbidden)],
      dark: [...new Set(dark)],
      slate: [...new Set(slate)],
    });
  }
}

if (violations.length) {
  console.error("Design token violations found:\n");
  for (const v of violations) {
    console.error(`  ${v.file}`);
    if (v.hex.length) console.error(`    hex: ${v.hex.join(", ")}`);
    if (v.text.length) console.error(`    sizes: ${v.text.join(", ")}`);
    if (v.forbidden.length)
      console.error(`    forbidden colors: ${v.forbidden.join(", ")}`);
    if (v.dark.length) console.error(`    dark: utilities: ${v.dark.join(", ")}`);
    if (v.slate.length) console.error(`    raw slate: ${v.slate.join(", ")}`);
  }
  process.exit(1);
}

console.log("Design token check passed.");
