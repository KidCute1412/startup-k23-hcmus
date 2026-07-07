---
name: frontend-ux-designer
description: Design, implement, or review Mutux frontend UX for gaming gear rental marketplace screens, product list/detail, wallet, order, admin flows, responsive layouts, design sketches, visual consistency, and screenshot verification.
---

# Frontend UX Designer

## Read First
- `frontend/design/sketch/*/Theme/DESIGN.md`
- Existing `frontend/design/sketch/*/*/code.html`
- Existing screenshots in the selected design direction
- Backend API docs if screens depend on real data

## Workflow
1. Keep the UI focused on a usable gaming gear rental marketplace, not a marketing-only landing page.
2. Prioritize product inspectability: gear photos, price per day, deposit/credit cues, availability, owner trust, and condition/proof signals.
3. Build dense but readable marketplace and operational screens.
4. Use responsive layout constraints so cards, controls, and text do not overlap on mobile or desktop.
5. Keep visual style consistent with the chosen sketch theme.
6. Verify screenshots across desktop and mobile when a runnable frontend exists.

## Quality Gates
- Desktop and mobile layout check.
- No text overflow in buttons/cards.
- Primary actions and expected empty/loading/error states are represented when implementing real app screens.
