---
name: Cyber Nexus
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ffffff'
  on-secondary: '#283500'
  secondary-container: '#c3f400'
  on-secondary-container: '#556d00'
  tertiary: '#faf3ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e1d2ff'
  on-tertiary-container: '#7213ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  technical-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered for the high-performance gaming gear rental market, targeting hardcore enthusiasts who demand precision and speed. The brand personality is aggressive, technical, and elite. It evokes the feeling of a high-end command center or a futuristic HUD.

The visual style is a hybrid of **High-Contrast Dark Mode** and **Glassmorphism**, heavily influenced by high-end gaming hardware aesthetics. It utilizes deep obsidian surfaces punctuated by "energy-infused" neon accents. The interface should feel like an integrated part of the hardware itself—fast, responsive, and uncompromisingly modern. 

Key attributes:
- **Atmospheric Depth:** Multi-layered dark surfaces with subtle glows.
- **Technical Precision:** Sharp edges and monospaced-adjacent typography.
- **Cyber-Glow:** Strategic use of neon light to guide user attention.

## Colors

The palette is anchored in a "Deep Space" black to maximize the pop of the neon accents.

- **Primary (Electric Blue):** Used for primary actions, active states, and core branding elements. It represents the "cool" efficiency of high-end liquid cooling and digital precision.
- **Secondary (Toxic Green):** Reserved for "Ready" states, availability indicators, and high-energy call-to-outs. It provides a sharp, vibrating contrast against the primary blue.
- **Tertiary (Neon Purple):** Used sparingly for "Legendary" gear tiers or special rental categories.
- **System Grays:** The neutral palette is strictly cool-toned to prevent the UI from looking "muddy." All grays have a slight blue/purple tint.

## Typography

Typography is a critical component of the technical aesthetic. 

**Sora** is the display face, chosen for its geometric rigor and wide proportions that feel stable and modern. It should be used for all major headings and product names.

**Geist** is the functional workhorse. It carries a developer-centric, monospaced-adjacent feel that reinforces the "high-tech" narrative. It is used for body text, specifications, and data points.

All labels and technical data (like frame rates or rental durations) should use uppercase with slight letter spacing to mimic a diagnostic readout.

## Layout & Spacing

The layout follows a **Rigid Fluid Grid** model. Elements are aligned to a 4px baseline to maintain a tight, engineered feel. 

- **Desktop:** A 12-column grid with 24px gutters. Content is often organized in "modular blocks" that look like stackable hardware units.
- **Mobile:** A 4-column grid with 16px margins.
- **Rhythm:** Spacing should be generous between sections to allow the glassmorphic glows to breathe, but tight within component groups (e.g., product specs) to emphasize technical density.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Tonal Layering** rather than traditional soft shadows.

1.  **Base Layer:** Solid black (#050505).
2.  **Surface Layer:** Dark grey (#121214) with a subtle 1px border (#26262B) to define edges.
3.  **Floating Glass Layer:** Semi-transparent containers (15-20% opacity) with a `backdrop-filter: blur(20px)`. These panels should have a slight "top-down" linear gradient to simulate glass catching the light.
4.  **Neon Glows:** Elements at the highest elevation (active buttons, featured products) emit a soft, tinted outer glow (`box-shadow`) matching their primary or secondary color.

## Shapes

This design system utilizes **Sharp Edges (0px)** for almost all UI elements. This choice reflects the aggressive, industrial design language found in high-end gaming laptops and peripherals.

- **Exceptions:** Very small UI indicators (like status pips) may be circular, but structural containers, buttons, and input fields must maintain 90-degree corners.
- **Accents:** Use 45-degree "clipped corners" for decorative elements or primary button hover states to reinforce the futuristic, stealth-fighter aesthetic.

## Components

### Buttons
- **Primary:** Solid Electric Blue background, black text, 0px border-radius. Hover state triggers a secondary Toxic Green outer glow and shifts the text slightly.
- **Secondary (Outline):** 1px Electric Blue border, transparent background. Text is Electric Blue.
- **Ghost:** No border, uppercase labels, Electric Blue text.

### Inputs & Fields
- Input fields should look like "data entry ports." Dark background, 1px bottom-only border by default. On focus, the border becomes Electric Blue and the background gains a 5% blue tint.

### Cards (The "Rig" Card)
- Use the Glassmorphic style: transparent background with blur. 
- Top-right corner of the card should feature a technical "ID tag" using the `technical-sm` typography style.
- Product images should be high-contrast with the background removed, appearing to float within the glass container.

### Status Chips
- **Available:** Toxic Green text with a matching 1px border. No background fill.
- **Rented:** Deep Grey text and border.
- **New Arrival:** Neon Purple text with a subtle background glow.

### HUD Overlays
- Tooltips and pop-overs should use the most aggressive glassmorphism (higher blur, lower opacity) to ensure they feel like they are floating above the "physical" interface. Use "scan-line" textures (subtle 1px horizontal stripes) for an extra technical layer.