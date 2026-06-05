# Neev Phygital Library — Design System

Premium SaaS design language for the Neev platform. Comparable quality targets: Linear, Stripe Dashboard, Mercury, Vercel.

## Architecture

```
src/styles/tokens.css     ← Single source of truth (colors, type, spacing, shadows, motion)
src/index.css             ← Tailwind @theme bridge + component utilities
src/lib/portal-typography.ts  ← Portal page typography constants
src/lib/admin-desk-ui.ts      ← Admin/hub desk layout tokens
src/lib/student-ui.ts         ← Student portal layout tokens
src/components/ui/*           ← Primitive components (Button, Card, Table, Input, Field…)
```

**Dark mode:** CSS variable swapping on `.dark` class via `next-themes`. No `dark:` utilities in application code. Components consume semantic tokens only.

## Typography

| Token class | Size | Use |
|-------------|------|-----|
| `hero-xl` / `hero-lg` / `hero-md` | 72 / 64 / 56px | Marketing heroes |
| `h1-scale` … `h4-scale` | 48 / 40 / 32 / 24px | Page & section headings |
| `body-large` / `body-scale` | 18 / 14px | Body copy |
| `caption-scale` / `text-meta` | 12px | Labels, meta, table headers |

**Fonts:** Manrope (display), Inter (body), JetBrains Mono (code).

Tailwind `text-sm`, `text-base`, etc. are remapped to semantic sizes in `@theme inline`.

## Color Tokens

### Surfaces
- `bg-background` / `bg-background-secondary` — page canvas
- `bg-surface` / `bg-surface-elevated` — panels, inputs
- `bg-card` / `bg-card-hover` — cards

### Text
- `text-foreground` / `text-foreground-muted` / `text-foreground-subtle`
- `text-on-media` / `text-on-media-muted` / `text-on-media-subtle` — overlays on images

### Brand
- `bg-primary` / `bg-primary-hover` / `text-primary-foreground`
- `bg-accent` / `bg-accent-hover` / `text-accent-foreground`

### Status
- `success`, `warning`, `error`, `info`, `destructive` — each with foreground variant

### Overlays
- `bg-modal-overlay` — dialogs, sheets, drawers
- `bg-overlay-scrim` / `bg-overlay-backdrop` / `bg-overlay-glass`

**Never use:** `bg-white`, `text-white`, `bg-black`, `text-black`, raw Tailwind palette colors.

## Card Variants

```tsx
<Card variant="default" />    // Standard elevated card
<Card variant="elevated" />   // Dashboard metrics
<Card variant="bento" />      // High-density bento layouts
<Card variant="glass" />      // Glassmorphism overlays
<Card interactive />          // Hover state for clickable cards
```

CSS utilities: `.card-standard`, `.card-elevated`, `.bento-card`, `.glass-card`

## Buttons

```tsx
<Button variant="default" />      // Primary
<Button variant="secondary" />    // Secondary
<Button variant="outline" />      // Outline
<Button variant="ghost" />        // Ghost
<Button variant="destructive" />  // Danger
<Button loading />                // Loading state
```

## Portal Constants

```ts
import { PORTAL_PAGE_TITLE, PORTAL_PAGE_LEAD, PORTAL_PANEL_SURFACE } from "@/lib/portal-typography"
import { ADMIN_STICKY_HEADER, adminPanel, ADMIN_PAGE_TITLE } from "@/lib/admin-desk-ui"
import { PORTAL_PAGE_CONTAINER, STUDENT_CARD_CHROME } from "@/lib/student-ui"
```

## Motion

- `--duration-fast` (150ms), `--duration-normal` (250ms), `--duration-slow` (350ms)
- `--ease-out` for hover/lift transitions
- Allowed: shadow transitions, opacity, subtle scale, hover elevation
- Avoid: bounce, flashy animations

## Accessibility

- WCAG AA contrast via semantic tokens
- `:focus-visible` ring using `--ring`
- `aria-busy` on loading buttons
- `role="alert"` on field errors
- Sticky table headers with `stickyHeader` prop

## CI Token Check

```bash
npm run check:tokens
```

Fails on hardcoded hex colors and arbitrary `text-[Npx]` outside allowlisted files.

## Theme Toggle

```tsx
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
```

Storage key: `neev-theme`. Supports `light`, `dark`, `system`.
