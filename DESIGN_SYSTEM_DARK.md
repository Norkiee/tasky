# Design System

## Philosophy
- **Dark**: Near-black backgrounds, dark surfaces, high contrast text
- **Minimal**: No decoration, no gradients, no shadows. Content speaks.
- **Quiet**: UI recedes. Subtle borders. Muted secondary elements.
- **Spacious**: Generous padding, breathing room, no clutter

## Colors

### Core Palette
```css
/* Backgrounds */
--bg-primary: #0A0A0A;       /* Page background - near black */
--bg-secondary: #141414;     /* Cards, surfaces */
--bg-tertiary: #1A1A1A;      /* Elevated surfaces, hover states */
--bg-input: #0D0D0D;         /* Input fields */

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);   /* Default */
--border-default: rgba(255, 255, 255, 0.10);  /* Cards, dividers */
--border-emphasis: rgba(255, 255, 255, 0.15); /* Hover, focus */

/* Text */
--text-primary: #FFFFFF;     /* Headings, important text */
--text-secondary: #A1A1A1;   /* Body text, descriptions */
--text-tertiary: #666666;    /* Muted, placeholders, hints */
--text-disabled: #404040;    /* Disabled states */

/* Accent */
--accent-primary: #8B5CF6;   /* Purple - primary actions */
--accent-hover: #7C3AED;     /* Purple hover */
--accent-muted: rgba(139, 92, 246, 0.15); /* Purple backgrounds */

/* Status */
--success: #22C55E;
--success-muted: rgba(34, 197, 94, 0.15);
--warning: #F59E0B;
--warning-muted: rgba(245, 158, 11, 0.15);
--error: #EF4444;
--error-muted: rgba(239, 68, 68, 0.15);
```

### Tailwind Config Colors
```js
colors: {
  bg: {
    primary: '#0A0A0A',
    secondary: '#141414',
    tertiary: '#1A1A1A',
    input: '#0D0D0D',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.10)',
    emphasis: 'rgba(255, 255, 255, 0.15)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1A1',
    tertiary: '#666666',
  },
  accent: {
    DEFAULT: '#8B5CF6',
    hover: '#7C3AED',
    muted: 'rgba(139, 92, 246, 0.15)',
  },
}
```

## Typography

### Font
- **Family**: Inter, system-ui, -apple-system, sans-serif
- **Weights**: 400 (regular), 500 (medium) only
- **Rendering**: antialiased

### Scale
| Use | Size | Weight | Color |
|-----|------|--------|-------|
| Page title | 18px | 500 | text-primary |
| Section title | 14px | 500 | text-primary |
| Body | 14px | 400 | text-secondary |
| Small | 13px | 400 | text-secondary |
| Caption | 12px | 400 | text-tertiary |
| Tiny | 11px | 400 | text-tertiary |

### Rules
- Sentence case always. Never Title Case.
- No bold (600/700). Use 500 max.
- No uppercase except tiny labels.

## Spacing

### Scale
- 4px (0.25rem) — tight
- 8px (0.5rem) — compact
- 12px (0.75rem) — default gap
- 16px (1rem) — comfortable
- 24px (1.5rem) — spacious
- 32px (2rem) — section breaks
- 48px (3rem) — major sections

### Application
| Element | Padding |
|---------|---------|
| Page | 24px |
| Card | 16px |
| Button | 8px 16px |
| Input | 10px 12px |
| Modal | 24px |
| Between cards | 12px |
| Between sections | 32px |

## Border Radius

| Size | Value | Use |
|------|-------|-----|
| sm | 6px | Inputs, small elements |
| md | 8px | Buttons, badges |
| lg | 12px | Cards, modals |
| xl | 16px | Large cards, panels |
| full | 9999px | Pills, avatars, circular buttons |

## Components

### Card
```css
.card {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  padding: 16px;
}
```

### Surface (no border)
```css
.surface {
  background: #141414;
  border-radius: 12px;
  padding: 16px;
}
```

### Primary Button
```css
.btn-primary {
  background: #8B5CF6;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
}
.btn-primary:hover {
  background: #7C3AED;
}
```

### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: #A1A1A1;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 400;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
}
```

### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: #A1A1A1;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #FFFFFF;
}
```

### Pill Button
```css
.btn-pill {
  background: #141414;
  color: #A1A1A1;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 9999px;
  padding: 6px 14px;
  font-size: 13px;
}
```

### Input
```css
.input {
  background: #0D0D0D;
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}
.input::placeholder {
  color: #666666;
}
.input:focus {
  border-color: rgba(255, 255, 255, 0.20);
  outline: none;
}
```

### Dropdown / Select
```css
.select {
  background: #141414;
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
}
```

### Badge
```css
.badge {
  background: rgba(255, 255, 255, 0.06);
  color: #A1A1A1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
}

/* Accent badge */
.badge-accent {
  background: rgba(139, 92, 246, 0.15);
  color: #A78BFA;
}

/* Success badge */
.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #4ADE80;
}
```

### Modal
```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.80);
}
.modal {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  padding: 24px;
  max-width: 480px;
}
.modal-title {
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 20px;
}
```

### Toast
```css
.toast {
  background: #1A1A1A;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  color: #FFFFFF;
}
```

### Sidebar
```css
.sidebar {
  width: 56px;
  background: transparent;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 8px;
}
.sidebar-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
}
.sidebar-icon:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #A1A1A1;
}
.sidebar-icon.active {
  background: rgba(139, 92, 246, 0.15);
  color: #8B5CF6;
}
```

### Project Card (Grid Item)
```css
.project-card {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px;
  overflow: hidden;
}
.project-card-thumbnail {
  height: 160px;
  background: #0D0D0D;
}
.project-card-info {
  padding: 12px 16px;
}
.project-card-title {
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 4px;
}
.project-card-meta {
  font-size: 12px;
  color: #666666;
}
```

### Avatar
```css
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: #8B5CF6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: #FFFFFF;
}
```

## Layout

### Page Structure
```
┌─────────────────────────────────────────────────────┐
│ [Sidebar 56px] │ [Main Content]                     │
│                │                                     │
│ Icon nav       │ Header bar                         │
│                │ ─────────────────────────────────  │
│                │                                     │
│                │ Content area                        │
│                │                                     │
│                │                                     │
│ [Avatar]       │ [Status bar / Footer]              │
└─────────────────────────────────────────────────────┘
```

### Header Bar
```css
.header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
```

### Content Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 24px;
}
```

## Icons

- **Style**: Outline/stroke, 1.5px stroke width
- **Size**: 20px default, 16px small, 24px large
- **Color**: text-tertiary (#666666), hover to text-secondary (#A1A1A1)
- **Library**: Lucide React recommended

## Interaction States

### Hover
- Buttons: Lighten background or border
- Cards: `border-color: rgba(255, 255, 255, 0.15)`
- Icons: Color from tertiary to secondary
- Links: Color from secondary to primary

### Focus
- Border: `rgba(255, 255, 255, 0.20)`
- No outline, use border change only

### Active / Pressed
- Buttons: Slightly darker or scale(0.98)

### Disabled
- Opacity: 0.4
- Cursor: not-allowed

## Do's

- Use near-black (#0A0A0A) as page background
- Use subtle borders (0.06-0.10 opacity white)
- Keep text hierarchy with color, not weight
- Use purple accent sparingly
- Large border radius (12px+) for cards
- Pill shapes for tags and status indicators
- Icon-only sidebar navigation
- Generous whitespace

## Don'ts

- No gradients
- No shadows (except subtle focus rings if needed)
- No bright colors on large surfaces
- No borders darker than background
- No text below 11px
- No font weight above 500
- No busy patterns or textures
- No colored backgrounds for cards (keep #141414)
