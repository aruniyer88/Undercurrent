# Undercurrent Design System

A comprehensive design system for the Undercurrent AI qualitative research platform. This document serves as the human-readable companion to `design-system.json` and defines the visual language, components, and patterns used throughout the application.

## Design Philosophy

### Style Personality

Undercurrent's design embodies **Enterprise SaaS** aesthetics:

- **Analytical, data-dense but calm** - Information-rich interfaces that don't overwhelm
- **Crisp, modern, unobtrusive** - Clean lines and purposeful spacing
- **Trustworthy and operational** - Professional enough for CEOs and brand managers
- **Minimal ornamentation; strong hierarchy** - Content takes center stage

### Core Principles

1. **Hierarchy through scale, weight, and whitespace** — not heavy borders
2. **Default to neutral surfaces** — reserve saturated color for actions and key metrics
3. **Prefer subtle separators** — 1px hairlines and soft shadows for layering
4. **Controls are compact and consistent** — minimize vertical jitter
5. **Tables are the primary canvas** — charts are secondary context

### Anti-Patterns to Avoid

- No heavy skeuomorphism, glassmorphism, neon gradients, or thick outlines
- Avoid large corner radii or pill-everything styling; keep radii restrained
- Avoid high-contrast dark text on saturated backgrounds (except for KPI tiles where text is white)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Primitives | shadcn/ui (Radix UI) |
| Icons | lucide-react |

### Project Structure

```
src/
├── app/                    # App Router root
│   ├── globals.css         # Global CSS & base typography
│   └── ...
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── features/           # Application components
└── lib/
    └── utils.ts            # cn() helper & utilities
```

---

## Typography

### Font Stack

**Primary Font: Inter**

A clean, geometric sans-serif optimized for UI. Professional and highly legible.

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
```

**Monospace Font:**

```css
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Tailwind Class |
|-------|------|-------------|----------------|--------|----------------|
| Display | 28px | 34px | -0.01em | 700 | `text-display` |
| H1 | 24px | 30px | -0.01em | 700 | `text-h1` |
| H2 | 20px | 26px | -0.01em | 700 | `text-h2` |
| H3 | 16px | 22px | 0 | 600 | `text-h3` |
| Body | 14px | 20px | — | 400 | `text-body` |
| Body Strong | 14px | 20px | — | 600 | `text-body-strong` |
| Caption | 12px | 16px | 0.01em | 400 | `text-caption` |
| Label | 12px | 16px | 0.02em | 600 | `text-label` |

### Hierarchy Rules

- Use `text-h1` for page titles; `text-h3` for section/card titles
- Use `text-label` for form field labels and table headers
- Use `text-caption` for meta text and helper text
- KPI values use custom sizing (18px / 22px) with font-bold (700)

---

## Color System

### Strategy

This design system uses **explicit Tailwind tokens** as the primary styling layer. We do NOT use shadcn's default CSS-variable semantic tokens (`bg-background`, `text-foreground`) as the primary system. Instead, all components use explicit project tokens.

### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `canvas` | #F5F7FB | Page background |
| `surface` | #FFFFFF | Card/panel background |
| `surface-alt` | #F9FAFC | Alternate surface, muted backgrounds |
| `border-subtle` | #E6EAF2 | Default borders (1px hairlines) |
| `border-strong` | #D6DCE8 | Emphasized borders |
| `text-primary` | #111827 | Headlines, primary text |
| `text-secondary` | #4B5563 | Body text |
| `text-muted` | #6B7280 | Placeholder, meta text |
| `icon-default` | #6B7280 | Default icon color |
| `icon-strong` | #374151 | Emphasized icons |

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | #EFF6FF | Light tint backgrounds |
| `primary-600` | #2563EB | Primary actions, links |
| `primary-700` | #1D4ED8 | Hover states |
| `primary-border` | #93C5FD | Focus rings |

### Semantic Colors

| Category | Token | Hex |
|----------|-------|-----|
| **Success** | `success-50` | #ECFDF5 |
| | `success-600` | #10B981 |
| | `success-700` | #059669 |
| **Warning** | `warning-50` | #FFFBEB |
| | `warning-600` | #F59E0B |
| **Danger** | `danger-50` | #FEF2F2 |
| | `danger-600` | #EF4444 |
| **Info** | `info-50` | #F0F9FF |
| | `info-600` | #0EA5E9 |

### Data Visualization

| Token | Hex | Usage |
|-------|-----|-------|
| `viz-blue` | #3B82F6 | Primary chart color |
| `viz-green` | #10B981 | Secondary chart color |
| `viz-teal` | #14B8A6 | Tertiary chart color |
| `viz-indigo` | #6366F1 | Quaternary chart color |
| `viz-gridline` | #E9EDF5 | Chart gridlines |
| `viz-axis-text` | #6B7280 | Axis labels |

### Dark Chrome (Topbar)

| Token | Hex | Usage |
|-------|-----|-------|
| `topbar-bg` | #0F172A | Topbar background |
| `topbar-text` | #E5E7EB | Topbar text |
| `topbar-icon` | #CBD5E1 | Topbar icons |

### Table Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `table-hover` | #F3F6FB | Row hover |
| `selected-row` | #EEF2FF | Selected row |

### Color Usage Rules

1. **All buttons use white text** (`text-white`) for consistent visual appearance and improved readability across all variants (primary, secondary, outline, ghost, destructive)
2. Primary actions use `primary-600` with white text; hover uses `primary-700`
3. Most surfaces remain white; use `canvas` as page background for subtle separation
4. Borders are hairline and subtle; default to `border-subtle`
5. Status badges use tinted semantic_50 backgrounds with darker semantic_700 text
6. Use saturated colors (`viz-*` / `semantic-*`) sparingly to preserve calm enterprise feel

---

## Spacing & Sizing

### 8pt Grid System

This project uses an **8pt grid with 4pt sub-steps**, implemented via custom Tailwind spacing overrides.

| Token | Value | Notes |
|-------|-------|-------|
| `0` | 0px | |
| `1` | 4px | |
| `2` | 8px | |
| `3` | 12px | |
| `4` | 16px | |
| `5` | 20px | |
| `6` | 24px | |
| `7` | 32px | **Custom** (Tailwind default: 28px) |
| `8` | 40px | **Custom** (Tailwind default: 32px) |
| `9` | 48px | **Custom** (Tailwind default: 36px) |
| `10` | 64px | **Custom** (Tailwind default: 40px) |
| `11` | 44px | Table row height |

> **Important:** This project overrides Tailwind's default spacing keys 7–10. For example, `h-9` equals 48px in this codebase.

### Common Layouts

| Element | Value | Tailwind |
|---------|-------|----------|
| Page container | max-width 1600px, padding 24px | `max-w-[1600px] mx-auto p-6 space-y-6` |
| Topbar height | 56px | `h-[56px]` |
| Sidebar width | 260px | `w-[260px]` |

### Control Sizes

| Control | Height (px) | Tailwind Height | Padding X |
|---------|-------------|-----------------|-----------|
| Button SM | 40px | `h-8` | `px-3` |
| Button MD | 48px | `h-9` | `px-4` |
| Input SM | 40px | `h-8` | `px-3` |
| Input MD | 48px | `h-9` | `px-3` |
| Select | 40px | `h-8` | `pl-3 pr-9` |
| Table Row | 44px | `h-11` | — |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xs` | 4px | Small elements |
| `rounded-sm` | 6px | Controls (buttons, inputs) |
| `rounded-md` | 8px | Menus, icon buttons |
| `rounded-lg` | 10px | Cards, panels |
| `rounded-xl` | 12px | Modals |
| `rounded-full` | 9999px | Pills, avatars |

### Default Radii by Component Type

- **Controls** (buttons, inputs): `rounded-sm` (6px)
- **Menus & Icon Buttons**: `rounded-md` (8px)
- **Cards & Panels**: `rounded-lg` (10px)
- **Modals**: `rounded-xl` (12px)
- **Pills & Avatars**: `rounded-full`

---

## Elevation & Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(16, 24, 40, 0.06)` | Cards with subtle border |
| `shadow-md` | `0 4px 10px rgba(16, 24, 40, 0.10)` | Toasts with subtle border |
| `shadow-lg` | `0 12px 24px rgba(16, 24, 40, 0.14)` | Modals with overlay scrim |

---

## Focus & Accessibility

### Contrast Requirements

| Context | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text | 3:1 |
| UI controls | 3:1 |

### Focus Ring Pattern

```css
focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-2
```

- Ring color: `#93C5FD`
- Offset: 2px
- Offset color: `#FFFFFF`

### Hit Target Sizes

| Element | Minimum Size |
|---------|--------------|
| General controls | 40px |
| Icon buttons | 48px |

---

## Icons

**Library:** lucide-react (outline style)

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| SM | 16px | Inline with text, buttons |
| MD | 20px | Navigation, standalone |
| LG | 48px | Empty states, illustrations |

### Icon Colors

| Token | Class | Usage |
|-------|-------|-------|
| Default | `text-icon-default` | Standard icons |
| Strong | `text-icon-strong` | Emphasized icons |
| Topbar | `text-topbar-icon` | Topbar icons |

---

## Motion & Animation

### Approach

Minimal and enterprise-calm. Transitions are primarily color changes on hover/focus.

### Recommended Utilities

- `transition-colors` — Color state changes
- `transition-transform` — Position/scale changes
- `animate-spin` — Loading indicators

### Anti-Patterns

- Bouncy overshoot easing
- Overly long durations (>300ms for micro-interactions)
- Distracting parallax effects

---

## Component Specifications

### Button

**Base Classes:**
```
inline-flex items-center justify-center gap-2 font-semibold transition-colors 
focus:outline-none focus:ring-2 focus:ring-primary-border focus:ring-offset-2 
disabled:opacity-45 disabled:cursor-not-allowed
```

**Sizes:**

| Size | Classes |
|------|---------|
| SM | `h-8 px-3 text-body-strong rounded-sm` |
| MD | `h-9 px-4 text-body-strong rounded-sm` |
| Icon | `h-9 w-9 rounded-md` |

**Variants:**

| Variant | Classes |
|---------|---------|
| Primary | `bg-primary-600 text-white border border-transparent hover:bg-primary-700` |
| Secondary | `bg-[#6B7280] text-white border border-transparent hover:bg-[#4B5563]` |
| Outline | `bg-primary-600 text-white border border-primary-700 hover:bg-primary-700` |
| Ghost | `bg-primary-600/80 text-white border border-transparent hover:bg-primary-600` |
| Destructive | `bg-danger-600 text-white border border-transparent hover:bg-[#DC2626]` |

**Important:** All button variants use white text (`text-white`) for consistent visual appearance and improved readability. This ensures a cohesive design language across all interactive elements.

### Input

**Base Classes:**
```
w-full bg-surface border border-border-subtle rounded-sm text-body 
placeholder:text-text-muted focus:outline-none focus:ring-2 
focus:ring-primary-border focus:border-transparent transition-colors
```

**Sizes:**

| Size | Classes |
|------|---------|
| SM | `h-8 px-3` |
| MD | `h-9 px-3` |

### Card

**Container:**
```
bg-surface border border-border-subtle rounded-lg shadow-sm
```

**Padding:** `p-4`

**Title Row:**
- Wrapper: `flex items-center justify-between mb-4`
- Title: `text-h3 text-text-primary`
- Actions: `flex items-center gap-2`

### Tabs

**Container:** `flex border-b border-border-subtle`

**Tab Button:**
```
h-10 px-4 text-body relative hover:bg-surface-alt transition-colors
```

**States:**
- Active text: `text-text-primary`
- Active indicator: `absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600`
- Inactive text: `text-text-secondary`

### Status Badge

**Base Classes:**
```
inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-caption
```

**Dot:** `w-1.5 h-1.5 rounded-full`

**Variants:**

| Status | Background | Text | Dot |
|--------|------------|------|-----|
| Live | `bg-success-50` | `text-success-700` | `bg-success-600` |
| In Progress | `bg-surface-alt` | `text-text-secondary` | `bg-warning-600` |
| Paused | `bg-warning-50` | `text-[#B45309]` | `bg-warning-600` |

### Modal/Dialog

**Overlay:** `absolute inset-0 bg-[rgba(17,24,39,0.45)]`

**Panel:**
```
relative w-[720px] max-w-[90vw] max-h-[90vh] 
bg-surface rounded-xl shadow-lg p-5 overflow-y-auto
```

**Header:**
- Wrapper: `flex items-center justify-between mb-4`
- Title: `text-h2 text-text-primary`
- Close button: `w-9 h-9 flex items-center justify-center rounded-md hover:bg-surface-alt`

### Toast

**Container:**
```
min-w-[320px] bg-surface border border-border-subtle border-l-4 
rounded-lg shadow-md p-3 flex items-start gap-3
```

**Variants (left border color):**
- Success: `border-l-success-600`
- Error: `border-l-danger-600`
- Info: `border-l-info-600`

### Table

**Container:** `bg-surface border border-border-subtle rounded-lg overflow-hidden`

**Header:** `bg-surface-alt border-b border-border-subtle`

**Header Cell:**
```
px-3 py-2.5 text-left text-label text-text-secondary 
cursor-pointer hover:bg-surface-alt/50
```

**Row:**
```
h-11 border-b border-border-subtle last:border-b-0 
hover:bg-table-hover transition-colors
```

**Cell:** `px-3 py-2.5 text-body text-text-primary`

---

## App Shell

### Page Background

`bg-canvas`

### Topbar

```
h-[56px] bg-topbar-bg text-topbar-text flex items-center 
justify-between px-4 border-b border-topbar-text/10
```

**Brand Mark:**
- Container: `w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center`
- Text: `text-white font-bold text-sm`

**Primary Action Button:**
```
h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white 
rounded-sm font-semibold text-body-strong flex items-center gap-2
```

### Sidebar (if applicable)

```
w-[260px] h-full bg-surface border-r border-border-subtle flex flex-col
```

### Content Area

- Scroll: `overflow-y-auto`
- Container: `max-w-[1600px] mx-auto p-6 space-y-6`

---

## shadcn/ui Integration

### Token Normalization

When adding new shadcn/ui components, **immediately replace** default template classes with explicit project tokens:

| Replace This | With This |
|--------------|-----------|
| `bg-background` | `bg-canvas` (page) or `bg-surface` (inside cards) |
| `text-foreground` | `text-text-primary` |
| `bg-card` | `bg-surface` |
| `text-card-foreground` | `text-text-primary` |
| `bg-popover` | `bg-surface` |
| `text-popover-foreground` | `text-text-primary` |
| `bg-muted` | `bg-surface-alt` |
| `text-muted-foreground` | `text-text-muted` |
| `border-border` | `border-border-subtle` |
| `border-input` | `border-border-subtle` |
| `ring-ring` | `ring-primary-border` |
| `bg-primary` | `bg-primary-600` |
| `text-primary-foreground` | `text-white` |
| `bg-secondary` | `bg-surface` |
| `text-secondary-foreground` | `text-text-primary` |

### Enforcement Rules

1. Do not add new hex values in shadcn components; if a token doesn't exist, add it to `tailwind.config.ts`
2. Keep shadcn component structure/ARIA behavior intact; only change classes, variants, and sizes
3. Prefer updating shadcn components in `src/components/ui/` once, rather than adding one-off overrides at call sites

---

## AI Implementation Guidelines

### Always Do

- Use existing Tailwind color tokens (`bg-canvas`, `bg-surface`, `border-border-subtle`, `text-text-primary`, etc.)
- Use typography scale classes (`text-h1`, `text-h2`, `text-h3`, `text-body`, `text-label`, `text-caption`)
- Match control sizes (Button MD = `h-9` = 48px; Input MD = `h-9` = 48px; Select = `h-8` = 40px)
- Use subtle borders and minimal shadows (`border-border-subtle` + `shadow-sm` for cards)
- Use focus rings exactly as implemented: `ring-2 ring-primary-border` with offset
- Compose/extend shadcn components rather than reinventing primitives
- Use the `cn()` helper from `src/lib/utils.ts` for all className composition
- Normalize new shadcn/ui components to this system immediately

### Never Do

- Don't use Tailwind default grays (`text-gray-500`); use semantic tokens (`text-text-secondary`)
- Don't introduce arbitrary pixel values when a token exists (use the spacing override scale 0–10)
- Don't change the meaning of existing tokens (don't repurpose `bg-canvas`)
- Don't use heavy gradients, thick borders, or large radii that break the enterprise look
- Don't accept shadcn/ui defaults blindly if they conflict with this spec
- Don't let shadcn's semantic tokens proliferate in the codebase

### Consistency Checklist

Before shipping any UI work, verify:

- [ ] Are all controls in a row the same height? (Typically `h-8` or `h-9`)
- [ ] Are borders using `border-border-subtle` and 1px weight?
- [ ] Are all buttons using white text (`text-white`) across all variants?
- [ ] Is the primary action using `bg-primary-600` + `hover:bg-primary-700` + `text-white`?
- [ ] Is typography using the defined scale (no random `text-[13px]` etc.)?
- [ ] Are icons from lucide-react and sized 16/20 consistently with text?

---

## File References

| File | Purpose |
|------|---------|
| `design-system.json` | Machine-readable source of truth |
| `tailwind.config.ts` | Tailwind token definitions |
| `src/app/globals.css` | Base typography, utility classes |
| `src/components/ui/` | shadcn/ui components (normalized) |
| `src/lib/utils.ts` | `cn()` helper function |
