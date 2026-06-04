import fs from 'fs';
import path from 'path';

const directoryPath = path.join(process.cwd(), 'src');

const replacements = [
  // Primary (Blue/Indigo)
  { regex: /\b(bg|text|border|ring|from|to|via)-(?:blue|indigo)-[4567]00(?![\/\w])/g, replacement: '$1-primary' },
  { regex: /\b(bg|text|border|ring)-(?:blue|indigo)-[12]00(?![\/\w])/g, replacement: '$1-primary/20' },
  { regex: /\b(bg|text|border|ring)-(?:blue|indigo)-[5]0(?![\/\w])/g, replacement: '$1-primary/10' },
  { regex: /\b(bg|text|border|ring)-(?:blue|indigo)-[89]00(?![\/\w])/g, replacement: '$1-primary/80' },
  { regex: /\b(bg|text|border|ring)-(?:blue|indigo)-950(?![\/\w])/g, replacement: '$1-primary/90' },
  
  // Secondary (Teal/Emerald)
  { regex: /\b(bg|text|border|ring|from|to|via)-(?:teal|emerald|cyan)-[4567]00(?![\/\w])/g, replacement: '$1-secondary' },
  { regex: /\b(bg|text|border|ring)-(?:teal|emerald|cyan)-[12]00(?![\/\w])/g, replacement: '$1-secondary/20' },
  { regex: /\b(bg|text|border|ring)-(?:teal|emerald|cyan)-[5]0(?![\/\w])/g, replacement: '$1-secondary/10' },
  { regex: /\b(bg|text|border|ring)-(?:teal|emerald|cyan)-[89]00(?![\/\w])/g, replacement: '$1-secondary/80' },
  { regex: /\b(bg|text|border|ring)-(?:teal|emerald|cyan)-950(?![\/\w])/g, replacement: '$1-secondary/90' },

  // Accent (Amber/Orange/Yellow)
  { regex: /\b(bg|text|border|ring|from|to|via)-(?:amber|orange|yellow)-[4567]00(?![\/\w])/g, replacement: '$1-accent' },
  { regex: /\b(bg|text|border|ring)-(?:amber|orange|yellow)-[12]00(?![\/\w])/g, replacement: '$1-accent/20' },
  { regex: /\b(bg|text|border|ring)-(?:amber|orange|yellow)-[5]0(?![\/\w])/g, replacement: '$1-accent/10' },
  { regex: /\b(bg|text|border|ring)-(?:amber|orange|yellow)-[89]00(?![\/\w])/g, replacement: '$1-accent/80' },
  { regex: /\b(bg|text|border|ring)-(?:amber|orange|yellow)-950(?![\/\w])/g, replacement: '$1-accent/90' },

  // Success (Green)
  { regex: /\b(bg|text|border|ring|from|to|via)-(?:green)-[4567]00(?![\/\w])/g, replacement: '$1-success' },
  { regex: /\b(bg|text|border|ring)-(?:green)-[12]00(?![\/\w])/g, replacement: '$1-success/20' },
  { regex: /\b(bg|text|border|ring)-(?:green)-[5]0(?![\/\w])/g, replacement: '$1-success/10' },
  { regex: /\b(bg|text|border|ring)-(?:green)-[89]00(?![\/\w])/g, replacement: '$1-success/80' },
  { regex: /\b(bg|text|border|ring)-(?:green)-950(?![\/\w])/g, replacement: '$1-success/90' },

  // Destructive (Red/Rose)
  { regex: /\b(bg|text|border|ring|from|to|via)-(?:red|rose)-[4567]00(?![\/\w])/g, replacement: '$1-destructive' },
  { regex: /\b(bg|text|border|ring)-(?:red|rose)-[12]00(?![\/\w])/g, replacement: '$1-destructive/20' },
  { regex: /\b(bg|text|border|ring)-(?:red|rose)-[5]0(?![\/\w])/g, replacement: '$1-destructive/10' },

  // Neutrals (Slate/Gray/Zinc)
  { regex: /\b(bg)-(?:slate|gray|zinc)-[5]0(?![\/\w])/g, replacement: '$1-muted' },
  { regex: /\b(bg)-(?:slate|gray|zinc)-100(?![\/\w])/g, replacement: '$1-muted/50' },
  { regex: /\b(border)-(?:slate|gray|zinc)-[123]00(?![\/\w])/g, replacement: '$1-border' },
  { regex: /\b(text)-(?:slate|gray|zinc)-[456]00(?![\/\w])/g, replacement: '$1-muted-foreground' },
  { regex: /\b(text)-(?:slate|gray|zinc)-[789]00(?![\/\w])/g, replacement: '$1-foreground' }
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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

console.log('Starting migration...');
processDirectory(directoryPath);
console.log('Migration complete.');
