import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'components');
const appTsxPath = path.join(__dirname, 'App.tsx');

const replacements = [
  { regex: /bg-zinc-950/g, replacement: 'bg-background' },
  { regex: /bg-zinc-900/g, replacement: 'bg-muted/50' },
  { regex: /bg-zinc-800/g, replacement: 'bg-muted' },
  { regex: /border-zinc-900\/80/g, replacement: 'border-border' },
  { regex: /border-zinc-900/g, replacement: 'border-border' },
  { regex: /border-zinc-850\/80/g, replacement: 'border-border/80' },
  { regex: /border-zinc-850/g, replacement: 'border-border' },
  { regex: /border-zinc-800/g, replacement: 'border-border/60' },
  { regex: /border-zinc-750/g, replacement: 'border-border' },
  { regex: /border-zinc-700/g, replacement: 'border-border' },
  { regex: /text-zinc-100/g, replacement: 'text-foreground' },
  { regex: /text-zinc-150/g, replacement: 'text-foreground' },
  { regex: /text-zinc-200/g, replacement: 'text-foreground/90' },
  { regex: /text-zinc-300/g, replacement: 'text-muted-foreground' },
  { regex: /text-zinc-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-zinc-450/g, replacement: 'text-muted-foreground/80' },
  { regex: /text-zinc-455/g, replacement: 'text-muted-foreground/80' },
  { regex: /text-zinc-500/g, replacement: 'text-muted-foreground/60' },
  { regex: /text-zinc-550/g, replacement: 'text-muted-foreground/50' },
  { regex: /text-white/g, replacement: 'text-foreground' },
  { regex: /hover:bg-zinc-900/g, replacement: 'hover:bg-muted' },
  { regex: /hover:bg-zinc-805/g, replacement: 'hover:bg-muted/80' },
  { regex: /hover:text-zinc-250/g, replacement: 'hover:text-foreground' },
  { regex: /hover:text-zinc-100/g, replacement: 'hover:text-foreground' },
  { regex: /bg-indigo-650/g, replacement: 'bg-primary' },
  { regex: /hover:bg-indigo-600/g, replacement: 'hover:bg-primary/90' },
  { regex: /text-indigo-400/g, replacement: 'text-primary' },
  { regex: /border-indigo-500\/30/g, replacement: 'border-primary/30' },
  { regex: /border-blue-900\/50/g, replacement: 'border-primary/50' },
  { regex: /bg-blue-950\/40/g, replacement: 'bg-primary/10' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

processDirectory(directoryPath);
processFile(appTsxPath);
console.log('Migration complete.');
