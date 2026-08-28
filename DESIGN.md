---
schemaVersion: 2
name: TO.W Editorial
tokens:
  colors:
    background: "oklch(96% 0.011 88)"
    ink: "oklch(20% 0.020 75)"
    inverse: "oklch(24% 0.095 25)"
    secondary: "oklch(43% 0.014 75)"
    card: "oklch(95% 0.012 88)"
    accent: "oklch(50% 0.24 29)"
  typography:
    body: "Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif"
    display: "Chillax"
  rounded: "2px for interface controls; square imagery and panels"
  spacing: "4px base scale"
components:
  - architectural-wordmark
  - course-notice
  - masonry-work-grid
  - product-card
  - dark-information-panel
---

# TO.W design system

## Overview

TO.W is a tough, clean photographic editorial system for Tove Wätte’s practice. Real images carry the experience. Warm paper, deep oxblood fields, square edges, restrained orange, and direct type give the work structure without turning the site into a conventional shop.

## Colors

The base is warm off-white (`--color-bg-base`) with near-black ink (`--color-text-primary`). Deep oxblood (`--color-bg-inverse`) owns decisive course, footer, and ordering panels, with matching tinted muted text and dividers. Orange (`--color-accent`) is reserved for active states and links.

## Typography

Body copy, navigation, metadata, and the uppercase wordmark use `--font-body-text`: Avenir, Montserrat, Corbel, URW Gothic, source-sans-pro, sans-serif. Chillax remains the selected heading voice through `--font-heading-text`. Type follows the fluid scale in `tokens.css`; headings stay compact and body copy remains readable rather than decorative.

## Layout

Pages sit within `--layout-site-width` and use the fluid `--layout-gutter`. The homepage image stream uses four columns on wide screens, three below 1024px, and two below 700px. Photography retains its native ratio. Product and About layouts collapse to a single readable column when space is constrained.

## Elevation & Depth

Depth is rare. Course cards may use `--shadow-card`; primary visual hierarchy comes from contrast, scale, and spacing. Avoid layered floating surfaces and decorative shadows.

## Shapes

Images, dark panels, and major cards are square-edged. `--radius-sm` is limited to small form controls where needed, and `--radius-full` is reserved for circular controls. Borders are mostly functional separators.

## Components

- Architectural wordmark: two uppercase lines, “TOVEWÄTTE” and “SILVERSMYCKEN,” set tightly in the Avenir-led body stack and at the same size in the header and footer.
- Course notice: a deep oxblood homepage block with tinted course copy, visible dates, and “läs mer” links to `/kurser`.
- Masonry work grid: all practice photographs mixed with three linked product cards. Photographs have no captions; products show title, price, and a short description.
- Product detail: one real photograph beside a compact deep oxblood facts and order panel.
- Course card: a light card surface with spacing and a soft tokenized shadow.
- Footer: deep oxblood editorial directory with the large wordmark, route links, contact information, and colophon.

## Do’s and Don’ts

- Do let real photography dominate and preserve its proportions.
- Do keep Swedish copy factual, direct, and understated.
- Do keep image collections at two columns on the smallest screens.
- Do use token variables for repeatable color, type, spacing, radius, and shadow values.
- Don’t reintroduce isolated transparent product renders.
- Don’t add rounded ecommerce cards, badges, invented claims, or decorative UI chrome.
- Don’t recreate a separate gallery route; the archive belongs to the homepage flow.
