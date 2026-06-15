---
name: Cyber Nexus Theme
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#994700'
  on-secondary: '#ffffff'
  secondary-container: '#fb7800'
  on-secondary-container: '#592600'
  tertiary: '#314368'
  on-tertiary: '#ffffff'
  tertiary-container: '#495a81'
  on-tertiary-container: '#c1d2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#ffdbc8'
  secondary-fixed-dim: '#ffb68b'
  on-secondary-fixed: '#321200'
  on-secondary-fixed-variant: '#753400'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#b4c6f3'
  on-tertiary-fixed: '#051a3e'
  on-tertiary-fixed-variant: '#35466c'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built upon a **Corporate Modern** aesthetic, prioritizing utility and perceived reliability. It targets a dual audience: the professional e-sports player requiring precision and the casual gamer seeking a frictionless rental experience. 

The visual language draws inspiration from high-scale marketplaces like Amazon and Lazada, utilizing heavy white space and a structured hierarchy to manage high-density information. The goal is to evoke a sense of **trust and technical proficiency** through a clean, systematic interface that minimizes cognitive load while providing clear paths to conversion.

## Colors
This design system utilizes a high-contrast palette designed for clarity and action:

- **Primary (Corporate Blue):** Used for core navigation, primary brand elements, and trust-building components. It communicates stability and professionalism.
- **Secondary (Action Orange):** Reserved strictly for primary Calls to Action (CTAs), "Rent Now" buttons, and critical alerts. Its warmth contrasts sharply against the blue to drive user focus.
- **Tertiary (Deep Navy):** Used for high-level headings and heavy text to maintain readability without the harshness of pure black.
- **Neutral (Surface Grays):** A range of cool grays provides the scaffolding for the UI. Backgrounds use a very light gray (#F4F5F7) to distinguish the canvas from white content cards.

## Typography
The typography strategy pairs **Manrope** for headlines with **Inter** for all functional and body text.

- **Manrope** provides a refined, modern geometric touch that feels technical yet approachable. It is used for all major section headings and product titles.
- **Inter** is the workhorse of the design system, selected for its exceptional legibility at small sizes—crucial for technical specifications, rental terms, and pricing tables.
- **Visual Hierarchy:** Large, bold headings are used to anchor the page, while secondary information is clearly delineated using systematic font weights (Regular 400 for body, Semi-bold 600 for labels).

## Layout & Spacing
The layout follows a strict **12-column fluid grid** for desktop and a **4-column grid** for mobile.

- **Grid Logic:** Elements should align to the 8px base unit. Product grids typically span 3 columns (4 items per row) on desktop to provide ample room for high-quality gear photography and meta-data.
- **Information Density:** Spacing is intentionally tighter in functional areas (like specifications lists) to mimic a professional catalog, but larger between major sections to provide visual "breathing room."
- **Responsive Behavior:** On mobile, margins shrink to 16px. Cards transition from a multi-column grid to a single-stack or a horizontal carousel to maintain the "Ease of Use" directive.

## Elevation & Depth
Depth is conveyed through **Tonal Layering** supplemented by subtle **Ambient Shadows**.

- **Surface Levels:** The primary background is neutral gray. Interactive content sits on pure white (#FFFFFF) cards. This creates a natural "lift" without requiring heavy shadows.
- **Shadows:** Use extremely soft, low-opacity shadows (e.g., `y: 2, blur: 8, color: rgba(0,0,0, 0.05)`) for hover states on product cards. This provides tactile feedback that an item is selectable.
- **Active States:** Elements being interacted with (like an open dropdown or a modal) use a secondary, more diffused shadow layer to appear higher in the visual stack.

## Shapes
The design system employs a **Rounded** shape language (0.5rem base) to balance professional rigidity with modern consumer accessibility.

- **Product Cards:** Use a consistent `rounded-lg` (1rem) for containers to soften the technical nature of gaming hardware.
- **Buttons & Inputs:** Follow the 8px (`0.5rem`) standard to maintain a clean, organized appearance. 
- **Icons:** Should feature slightly rounded caps and corners to match the UI's geometric yet friendly tone. Avoid sharp, aggressive "gamer" aesthetics in favor of clean, iconographic clarity.

## Components
- **Buttons:** Primary buttons are Solid Orange with white text. Secondary buttons are Outlined Blue with white backgrounds. Buttons should be tall (48px+) for easy clicking/tapping.
- **Product Cards:** Must include a high-res image, a "Verified Gear" badge, price per day (prominent), and a quick-add "Rent" button.
- **Input Fields:** Use a light gray stroke (#DFE1E6) that thickens and changes to Primary Blue on focus. Labels always sit above the field for maximum readability.
- **Status Chips:** Use rounded-pill shapes for status indicators (e.g., "Available" in green, "In Use" in blue).
- **Comparison Table:** A key component for this system. It should use alternating row stripes (zebra striping) in light gray to help users compare specs across different gear models.
- **Trust Badges:** Prominent "Insurance Included" and "Quality Checked" icons should be present throughout the checkout and product pages to reinforce the brand's reliability.