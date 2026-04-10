---
name: uber-design
description: Design and restyle UI in this Next.js repo using an Uber-inspired visual system. Use when Codex needs to create or refresh pages, sections, navigation, forms, cards, or CTAs with a high-contrast black-and-white aesthetic, pill-shaped controls, compact spacing, and confident editorial hierarchy while still respecting this repo's Tailwind, Ant Design, and global CSS constraints.
---

# Uber Design

## Overview

Apply the Uber-inspired design direction from this repo's generated design guide without fighting the existing frontend stack. Use the reference file for exact visual rules, then adapt them carefully to Tailwind, Ant Design, and the repo's global CSS overrides.

## Quick Start

1. Inspect the target component or page and nearby styles before changing anything.
2. Read [references/uber-design-system.md](references/uber-design-system.md) when you need the exact palette, component language, spacing, or responsive rules.
3. Preserve the repo's current implementation patterns first, then layer the Uber look through contrast, scale, radius, spacing, and layout choices.
4. Verify the result on desktop and mobile. The Uber direction should feel deliberate, not just "black buttons on white."

## Workflow

### 1. Map the current styling surface

- Inspect the page, component, and any shared wrappers it relies on.
- Check whether styling lives in Tailwind class strings, Ant Design props and tokens, local CSS, or [`src/app/globals.css`](../../../src/app/globals.css).
- Reuse existing layout primitives when they are structurally sound. Change only the parts needed to move the UI toward the Uber system.

### 2. Translate the design system to this repo

- Use true black and white as the main visual contrast.
- Use full-pill controls for buttons, chips, and segmented actions whenever that fits the component.
- Keep layouts compact and information-dense. Favor strong hierarchy over decorative flourishes.
- Prefer subtle shadows and flat color blocks over gradients or heavy effects.
- Keep the repo's existing `Bai Jamjuree` font stack unless the user explicitly asks to replace it. Approximate Uber through sizing, weight, spacing, and shape rather than forcing a proprietary font.

### 3. Choose the right implementation path

- For Tailwind-driven UI, introduce a small set of reusable classes or CSS variables instead of one-off utility noise.
- For Ant Design components, prefer component props, token-friendly styling, or scoped overrides before adding broad global `.ant-*` rules.
- For repeated patterns across a page, centralize shared visual decisions such as surface color, radius, button treatment, and spacing.

### 4. Apply the strongest Uber cues first

- Hero and section headings: bold, direct, high-contrast, minimal ornament.
- Primary actions: black pill buttons with white text.
- Secondary actions: white or light-gray pills with black text.
- Navigation and filters: pill chips with clear selected state inversion.
- Cards: restrained radius, whisper-light shadow, compact internal spacing.
- Layout: confident split sections, dense feature rows, dark footer when appropriate.

### 5. Finish with responsive checks

- Ensure stacked mobile layouts still feel intentional, not collapsed desktop layouts.
- Keep touch targets comfortable, especially for pill controls and floating actions.
- Confirm that typography scales down cleanly and that dense sections do not become cramped.

## Design Rules

- Read [references/uber-design-system.md](references/uber-design-system.md) for exact values when the change is substantial.
- Treat black and white as the base system. Add color only when the surrounding product requirements clearly need it.
- Use `999px` pill radii for buttons, chips, and similar controls whenever possible.
- Favor solid fills, subtle shadows, and hard contrast. Avoid gradients, glows, and soft pastel styling.
- Keep copy hierarchy clear and bold. Uber-inspired UI works best when headings are decisive and body text stays simple.
- Prefer image-led or illustration-led sections over decorative abstract shapes when a hero needs more presence.

## Repo Notes

- This repo uses Tailwind plus Ant Design and already has extensive global overrides in [`src/app/globals.css`](../../../src/app/globals.css).
- The global stylesheet currently enforces `Bai Jamjuree` across much of the app. Do not introduce Uber proprietary fonts unless the user provides assets and explicitly wants a font change.
- When working inside existing screens, preserve established product behavior and information architecture unless the user asks for a broader redesign.
- If a component already uses shared helper classes or motion conventions, adapt them instead of replacing them wholesale.

## Guardrails

- Do not imitate Uber by copying branded assets, proprietary fonts, or trademarked illustrations.
- Do not add broad global overrides unless the design change truly needs app-wide behavior.
- Do not rely on color alone for selected or active state; pair inversion with shape, weight, or contrast.
- Do not make layouts airy or generic. The target feeling is confident, efficient, and urban.
- Do not sacrifice readability for strict aesthetic imitation.

## References

- Uber-inspired design spec for this repo: [references/uber-design-system.md](references/uber-design-system.md)
