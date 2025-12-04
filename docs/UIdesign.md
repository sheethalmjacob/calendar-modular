# UI Design Specification - Calendar Modular

## 1. Page Layout & Structure

### Overall Page
- **Background**: Warm light gray / beige `#F3F0E9` (or similar — pull exact from shared link)
- **Max width**: ~1200–1280px (follow design's container width)
- **Page padding**: 
  - Top: ~40–60px
  - Sides: ~40–80px (depending on Figma)

---

## 2. Typography

### Headings

#### Main Heading ("Class Schedule Manager")
- **Font**: Large, bold sans-serif
- **Font-size**: 40–48px
- **Weight**: 600–700
- **Color**: Black or deep charcoal (`#000` or `#111`)

#### Subheading Paragraph
- **Color**: Light gray (`#646464` or Figma value)
- **Font-size**: ~16–18px
- **Line-height**: ~1.5

### Dates Inside Calendar & Labels

#### Day Names ("Mon", "Tue", etc.)
- **Weight**: Medium
- **Font-size**: 14–16px

#### Dates ("2", "3", etc.)
- **Font-size**: Slightly larger or same (match Figma exactly)

#### "No events today"
- **Color**: Light gray
- **Font-size**: ~14px

### Class Cards Text

#### Time
- **Weight**: Bold
- **Font-size**: 14–16px

#### Course Title
- **Weight**: Medium
- **Font-size**: ~14px

#### Room Info
- **Font-size**: Small text, ~12–13px
- **Icon**: Included with text

---

## 3. Buttons (Top Section)

### Primary Button (Solid Black)
- **Style**: Solid black button
- **Text**: White, medium weight
- **Shape**: Fully rounded pill (`border-radius: ~40–999px`)
- **Height**: ~44–48px
- **Leading icon**: Upload icon (white, inside circle)

### Day/Week Toggle Buttons ("Day by Day", "Weekly View")

#### Active Button
- **Background**: Black
- **Text**: White

#### Inactive Button
- **Background**: White
- **Border**: Black
- **Text**: Black

---

## 4. Legend (Lecture / Lab/Discussion Pills)

### Style
- Small color circles with text labels

### Colors
- **Class**: Lavender (`#D8B2D9` approx)
- **Personal**: Yellow (`#EEDC5B` approx)

### Layout
- **Text**: Gray or black (pull exact Figma value)
- **Spacing**: Circle left, label right, small gap (~6–8px)

---

## 5. Week Navigation Buttons (Left/Right Arrows)

### Style
- Two circular buttons
- **Icon**: Black arrow icon inside white background (for inactive)
  - OR reverse, depending on design:
    - Black circle for active?
    - White circle w/ black border?
  - Match Figma precisely

### Sizing
- **Diameter**: ~36–40px
- **Icon**: Center-aligned

### Hover State
- Slight subtle shadow or opacity change (match Figma)

---

## 6. Calendar Structure

### Overall Calendar Box
- **Border-radius**: ~18–24px
- **Border**: 1px light gray/dark gray line
- **Grid**: 7 columns (Mon–Sun)

### Column Header
**Contains**:
- Day name at top (Mon, Tue…)
- Date number below (2, 3…)

**Vertical spacing**:
- Top padding: ~20px
- Space between day name and date: ~4–8px

**Divider lines**: 1px gray stroke between columns

### Grid Cells
- Each day column has vertical space for event cards
- **Background**: Transparent white
- **"No events today"**: Centered vertically
- **Height**: Defined by weekly layout — should expand as content grows

---

## 7. Class Event Cards

These are the pink and yellow pill-shaped rectangles placed in the columns.

### General Style
- **Border-radius**: 16–20px
- **Padding**: ~16px internal padding
- **Drop shadow**: Subtle, soft (pull exact Figma shadow)

### Colors
- **Class (pink/purple card)**: `#D8B2D9` (approx)
- **Personal (yellow card)**: `#EEDC5B` (approx)
- **Note**: Exact colors in Figma must be used

### Layout Inside the Card
**Top to bottom**:
1. **Time range** ("09:00–10:30") — bold
2. **Course name** ("CS 101: Intro to…")
3. **Last line**: Row with:
   - Small location pin icon
   - Room text

**Text alignment**: Left

**Spacing**:
- ~4px between text lines
- ~8–10px from edges

### Sizing
- Cards stretch vertically according to content
- **Width**: Full width of column minus padding
- Cards should not overlap
- **Vertical spacing**: ~8–12px between cards

---

## 8. Interaction / Hover Behavior

### Buttons

#### Solid Black Button
- Darkens slightly or shows subtle shadow on hover

#### Outline Button
- Black outline darkens
- Background shifts slightly lighter

#### Dropdown
- Chevron rotates on open

### Class Cards
- Slight scale-up or shadow increase on hover (if included in Figma)
- **No change** to background color

### Calendar Cells
- "No events today" should not animate or react

### Left/Right Navigation Buttons
- Background darkens slightly on hover

---

## 9. Responsiveness

### Desktop (Screenshot Scale)
- 7 full-width columns visible

### Tablet
- Switch to scrollable weekly grid or reduce columns to stack (depending on Figma)
- Buttons compress into 2 rows

### Mobile
- Likely becomes vertical, scrollable day-by-day view:
  - Single column
  - Events listed vertically

### General Rules
- Typography scales down by ~10–20%
- Buttons collapse into stacked layout
- Keep spacing proportional

---

## 10. Icons

### Requirements
- **Format**: Use SVGs only
- **Location pin**: Must match design (filled or outline)
- **Upload icon**: Pixel-perfect from Figma
- **Plus icon**: Pixel-perfect from Figma

---

## 11. Shadows & Borders

### Calendar Outer Border
- **Border**: 1px medium gray

### Card Shadows
- **Style**: Soft, diffused — no harsh edges
- **Values**: Use exact shadow values from Figma Inspect:
  - X offset
  - Y offset
  - Blur
  - Spread
  - Opacity

---

## 12. Spacing Rules (Critical)

Use exact spacing values from Figma, but common patterns in screenshot:

### Section Spacing
- **Title → Buttons**: 24–32px
- **Buttons row gap**: ~12–16px
- **Top of calendar → Month label**: ~48px
- **Month label → Calendar box**: ~24px
- **Inside calendar**: Uniform padding ~24px

### Grid Rule
- Spacing must follow the **8px grid rule** (or the Figma-defined rhythm)

---

## Design Reference

- **Figma Link**: https://shrug-many-16932283.figma.site
- **Local Reference**: `/workspaces/calendar-modular/docs/design/FigmaCalendar.png`

---

## Implementation Notes

### CSS Variables (Recommended)
```css
:root {
  /* Colors */
  --bg-warm-beige: #F3F0E9;
  --text-primary: #000;
  --text-secondary: #646464;
  --class-lavender: #D8B2D9;
  --personal-yellow: #EEDC5B;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  /* Border Radius */
  --radius-sm: 16px;
  --radius-md: 20px;
  --radius-lg: 24px;
  --radius-pill: 999px;
  
  /* Typography */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 40px;
  --text-2xl: 48px;
}
```

### Component Hierarchy
1. **Page Container** (max-width, centered)
2. **Header Section** (title, subtitle, buttons)
3. **Legend Section** (color pills)
4. **Calendar Container**
   - Week Navigation
   - Calendar Grid
     - Column Headers
     - Day Cells
       - Event Cards

### Accessibility Considerations
- Ensure all interactive elements have proper focus states
- Maintain color contrast ratios (WCAG AA minimum)
- Provide alt text for all icons
- Support keyboard navigation for calendar interactions

---

*Last Updated: December 4, 2025*
