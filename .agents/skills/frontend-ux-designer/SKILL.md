---
name: frontend-ux-designer
description: Design, implement, or review Mutux frontend UX for gaming gear rental marketplace screens, product list/detail, wallet, order, admin flows, responsive layouts, design sketches, visual consistency, and screenshot verification.
---

# Frontend UX Designer

## Read First
- `frontend/design/sketch/Vanguard elite/Theme/DESIGN.md`
- `frontend/design/sketch/Vanguard elite/*/code.html`
- `frontend/design/sketch/Vanguard elite/*/*Screen.png`
- `frontend/src/app/page.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- `frontend/tailwind.config.ts`
- Backend API docs if screens depend on real data

Use other sketch directions only when the user explicitly requests them or when Vanguard Elite lacks the context needed for the task.

## Workflow
1. Keep the UI focused on a usable gaming gear rental marketplace, not a marketing-only landing page.
2. Prioritize product inspectability: gear photos, price per day, deposit/credit cues, availability, owner trust, and condition/proof signals.
3. Build dense but readable marketplace and operational screens.
4. Use responsive layout constraints so cards, controls, and text do not overlap on mobile or desktop.
5. Keep visual style consistent with Vanguard Elite unless the user explicitly chose another sketch theme.
6. Verify screenshots across desktop and mobile when a runnable frontend exists.
7. Prioritize Server-Side Rendering (SSR) & React Server Components to optimize initial page loading speed and data security. Only use Client Components ("use client") at interactive boundaries (e.g., forms, buttons, client states).
8. Implement SEO best practices on every route (dynamic/static metadata, page titles, descriptions, single <h1> heading, semantic HTML).

## Quality Gates
- From `frontend`, run `npm run lint` when TS, TSX, or CSS files changed.
- Desktop and mobile layout check.
- No text overflow in buttons/cards.
- Primary actions and expected empty/loading/error states are represented when implementing real app screens.
- Verify hydration safety when utilizing client-only browser APIs (e.g., localStorage) in Client Components.

