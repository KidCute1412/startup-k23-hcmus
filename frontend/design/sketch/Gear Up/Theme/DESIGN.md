---
name: Gear Up Theme
colors:
  surface: '#0f172a'
  surface-dim: '#020617'
  surface-bright: '#1e293b'
  surface-container-lowest: '#000000'
  surface-container-low: '#0f172a'
  surface-container: '#1e293b'
  surface-container-high: '#334155'
  surface-container-highest: '#475569'
  on-surface: '#f8fafc'
  on-surface-variant: '#94a3b8'
  outline: '#475569'
  outline-variant: '#334155'
  primary: '#8b5cf6'
  on-primary: '#ffffff'
  primary-container: '#6d28d9'
  on-primary-container: '#ddd6fe'
  secondary: '#06b6d4'
  on-secondary: '#ffffff'
  secondary-container: '#0891b2'
  on-secondary-container: '#cffafe'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#b91c1c'
  on-error-container: '#fecaca'
  background: '#0f172a'
  on-background: '#f8fafc'
typography:
  headline-xl:
    fontFamily: Rajdhani
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Rajdhani
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Rajdhani
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    textTransform: uppercase
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

## Brand & Style
The design system for **Gear Up** is built on a **Cyberpunk / Edgy Gamer** aesthetic. It targets hardcore gamers, esports enthusiasts, and streamers who want access to top-tier equipment in an environment that feels natively "gamer."

The visual language uses a deep, rich dark mode paired with high-energy neon accents. Glassmorphism and glowing shadows are heavily utilized to create a futuristic, high-tech vibe that feels premium and powerful.

## Colors
This design system utilizes a stark contrast between pure darks and vibrant neons:

- **Primary (Neon Purple):** The brand's core color. Used for prominent buttons, active states, and glowing accents. Represents power and luxury.
- **Secondary (Cyber Cyan):** Used as a secondary accent for badges, hover states, and techy details. Creates a classic cyberpunk contrast against the purple.
- **Neutral (Slate Darks):** The background relies on varying shades of slate (deep blue-gray) rather than pure black, providing depth and reducing eye strain while maintaining a dark aesthetic.

## Typography
The typography pairs **Rajdhani** for an aggressive, futuristic feel with **Inter** for supreme readability.

- **Rajdhani** is used for all major headings. Its squared-off geometry and technical appearance align perfectly with the hardware rental theme.
- **Inter** ensures that despite the flashy design, all functional text (specs, terms, prices) remains completely legible.
- **Text Transform:** Labels and small headings often utilize uppercase tracking (letter-spacing) to enhance the technical HUD (Heads-Up Display) aesthetic.

## Elevation & Depth (Glassmorphism)
Depth is primarily conveyed through **Glassmorphism** and **Neon Glows**.

- **Glass Cards:** Primary content containers use a translucent background (`rgba(30, 41, 59, 0.7)`) with a strong backdrop blur (`backdrop-filter: blur(16px)`).
- **Neon Shadows:** Instead of traditional drop shadows, interactive elements cast colored glowing shadows matching their primary or secondary color, reinforcing the cyberpunk theme.

## Components
- **Buttons:** Primary buttons feature a neon purple background with a corresponding glow effect on hover. They use angular borders or sharp radiuses to feel aggressive.
- **Product Cards:** Dark glassmorphic panels featuring stark imagery of the gear. Price is highlighted in Cyan, while "Rent" actions are Purple.
- **Tags/Badges:** Small, glowing outline pills used to denote "Available", "New", or specific specs like "144Hz" or "Wireless".
- **Gradients:** Soft, large radial gradients are placed behind the main canvas to simulate glowing LED strips bleeding into the background.
