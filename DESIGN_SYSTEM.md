# FitRos design system — Cinematic Dark ✕ FitRos Gold

**Status:** established 2026-08-27. Single source of truth: `src/styles.css`
(`@theme` block + `@layer components`). This document explains the *why* and
the *how to apply*.

## The remix

The structure — type scale, spacing rhythm, gradient + motion treatment, depth
model — takes cues from the "cinematic dark" style popular in current product
UI design: pure-dark canvas, oversized display type, motion-forward
transitions, film-grade gradients. What we **keep** from that direction:

| Trait | How we apply it |
|---|---|
| Pure-dark canvas, tonal surface steps | `canvas → surface → surface-raised` (slate 950 → 900 → 800) |
| Big-jump type scale, tight display tracking | `text-eyebrow / meta / body / h2 / h1 / display`, `-0.02em` on `h1`/`display` |
| 8px spacing base, generous vertical rhythm | Tailwind's 8px scale; page padding `py-8`, section gaps `mb-6`/`gap-6` |
| Gradients are expected — on the brand button and as hairline accents | `--gradient-brand` (135°), `--gradient-hairline`, `--gradient-scrim` |
| Motion-forward: 150–300ms, one deliberate `ease` | `--ease-cine` = `cubic-bezier(0.2,0,0,1)`, `--dur-quick/base/slow` |
| Atmospheric depth: deep soft shadows, backdrop blur, focus glow | `--shadow-card`, `backdrop-blur-xl` on cards/modals, `--shadow-glow` focus |
| Lift reserved for exactly one place | only `.btn-brand` gets `hover:-translate-y-px` |

What we **do NOT** take — the palette. Cinematic-dark references usually lean
magenta/cyan or signature green. We keep the established **FitRos gold**
(`yellow-500` fill / `yellow-400` accent / `amber-500` gradient terminus) on
our slate canvas. This is a remix, not a reskin.

## Tokens

All tokens live in `@theme` in `src/styles.css` and are **additive** — each
name is namespaced so it never shadows a stock Tailwind utility. Tailwind v4
generates the utilities automatically (`--color-ink` → `text-ink`, `bg-ink`,
`border-ink`; `--radius-card` → `rounded-card`; `--shadow-card` → `shadow-card`;
`--ease-cine` → `ease-cine`; `--text-h1` → `text-h1`).

### Color

| Token | Value | Role |
|---|---|---|
| `canvas` | `#020617` slate-950 | page background |
| `canvas-raised` | `#0b1120` | subtle raised band on canvas |
| `surface` | `#0f172a` slate-900 | cards, modals |
| `surface-raised` | `#1e293b` slate-800 | nested controls, hover rows |
| `ink` | `#f1f5f9` slate-100 | primary text |
| `ink-muted` | `#94a3b8` slate-400 | secondary text |
| `ink-dim` | `#64748b` slate-500 | labels, meta, eyebrows |
| `ink-faint` | `#475569` slate-600 | placeholder text |
| `hairline` | `#1e293b` | default border |
| `hairline-strong` | `#334155` slate-700 | emphasised border |
| `accent` | `#eab308` yellow-500 | brand fills, focus ring |
| `accent-bright` | `#facc15` yellow-400 | icons, text accent |
| `accent-deep` | `#f59e0b` amber-500 | gradient terminus |
| `on-accent` | `#0b0f19` | text/icons on gold fills |
| `positive` / `critical` | emerald / red-300 family | status text |

### Type scale (`text-*`)

`eyebrow` 11 · `meta` 12 · `body` 14 (app default) · `h2` 16 · `h1` 24 · `display` 48.
`eyebrow` ships uppercase weight-600 `0.14em` tracking; `h1`/`display` ship `-0.02em`.

### Radius / shadow / motion

`rounded-field` 16px (inputs, small buttons, chips) · `rounded-card` 24px (cards, modals) ·
`rounded-pill`.
`shadow-card` (deep soft) · `shadow-btn` (gold cast) · `shadow-glow` (focus).
`ease-cine` + `--dur-quick|base|slow` (150 / 200 / 300 ms).

### Non-utility raw values (`:root`)

`--gradient-brand` (135° yellow-400 → amber-500), `--gradient-hairline` (the thin strip on
top of every card), `--gradient-scrim` (image/overlay legibility).

## Component classes (`@layer components`)

Prefer these over re-typing the utility cluster. They encode the current look 1:1 plus the
cinematic remix (135° gradient, tokenised depth, `ease-cine`, button lift).

| Class | Use for |
|---|---|
| `.page-shell` | outer `<div>` of every routed page |
| `.page-eyebrow` / `.page-title` / `.page-title-accent` / `.page-subtitle` | page header block |
| `.card` / `.card-flat` | primary surface (`.card` has blur + shadow + ring) |
| `.card-hairline` | the 1px gradient strip — first child inside a `.card` |
| `.card-header` / `.card-header-icon` | card title row with icon chip |
| `.btn-brand` | primary action (gold gradient, the only element that lifts on hover) |
| `.btn-ghost` | secondary / cancel |
| `.btn-icon` (+ `.btn-icon-danger`) | 32px icon-only row action |
| `.field-label` / `.field` | form control + its label |
| `.table-head-cell` / `.table-row` | data tables |
| `.alert-error` / `.alert-success` | inline feedback banners |
| `.badge-accent` / `.badge-muted` | status pills |
| `.spinner` / `.spinner-sm` | loading indicators (`.spinner-sm` inherits `currentColor`) |
| `.modal-scrim` / `.modal-panel` | dialog overlay + panel |

## Rules

**Do**
- Reach for a component class first; drop to raw utilities only for one-off layout.
- Keep gold for action and brand emphasis only — chrome stays slate.
- Use `text-eyebrow` (uppercase) for column headers and section labels.
- Use `ease-cine` + a token duration for any new transition.
- Put a `.card-hairline` at the top of feature cards; keep list/row cards plain.

**Don't**
- Introduce a second accent hue, or gradient gold into another color.
- Add hover lift/scale anywhere except `.btn-brand`.
- Hard-code slate/yellow hexes or `rgba(212,175,55,…)` shadows in a component — add a token.
- Override a stock Tailwind theme key in `@theme` (keep tokens namespaced).

## Migration status

Pages refactored onto the system: Exercises, Profile, Client form, Routines, My training,
Measures, My progress. Remaining pages pick up the tokens as they're touched.
