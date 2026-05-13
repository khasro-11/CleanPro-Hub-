# CleanPro Hub — Brand Colors

## Primary Brand Color

| Token      | Hex       | HSL                | Usage                          |
| ---------- | --------- | ------------------ | ------------------------------ |
| brand-500  | `#0EA5E9` | `199 89% 48%`      | Primary buttons, links, focus  |
| brand-600  | `#0284C7` | `201 90% 40%`      | Hover state of primary         |
| brand-400  | `#38BDF8` | `199 95% 60%`      | Light accent, icons            |
| brand-50   | `#F0F9FF` | `204 100% 97%`     | Subtle backgrounds             |
| brand-950  | `#082F49` | `204 82% 16%`      | Dark sidebar, nav              |

## CSS Custom Properties

In `globals.css`, the primary color is mapped to:
```css
--primary: 199 89% 48%;         /* #0EA5E9 Sky Blue */
--primary-foreground: 0 0% 100%;
--ring: 199 89% 48%;
```

## Usage Rules

- **Primary CTA buttons:** `bg-brand-500 hover:bg-brand-600`
- **Text links:** `text-brand-500 hover:text-brand-600`
- **Focus rings:** `ring-brand-500 / ring-2 ring-offset-2`
- **Sidebar dark bg:** `bg-brand-950`
- **Sidebar active item:** `bg-brand-500/15 text-brand-400`
- **Brand shadows:** `shadow-brand-sm / shadow-brand-md / shadow-brand-lg`

## Forbidden

- ❌ No Tailwind `blue-*` or `indigo-*` as primary brand color.
- ❌ No generic `shadow-md` — use `shadow-elevated` or `shadow-floating`.
