---
schemaVersion: 2
name: TO.W Frame
tokens:
  colors:
    ren: "warm off-white page, black type and buttons, logo pink accents"
    supreme: "rgb(237, 28, 36) page, white type; white courses band, black Instagram and footer"
    bla: "oklch(46.7% 0.121 248) page, paper type, oklch(78% 0.15 350) pink accent"
  typography:
    display: "Jost (heavy italic for headings)"
    text: "EB Garamond (sentences), x-height matched to Jost"
  rounded: "square everywhere (--radius: 0); --radius-full for the theme swatches"
  spacing: "4px base: 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192"
components:
  - site-frame
  - hero
  - product-carousel
  - courses-teaser
  - instagram-feed
  - footer
---

# TO.W design system

Every value lives in `src/styles/tokens.css`. Components never hardcode a repeatable value. The only literal numbers are one-off geometry tied to a specific image, such as the hero's hands, the drawn flowers, the bird and the watering can.

## Themes

`SiteFrame.astro` wraps every page and carries three colour themes, which visitors switch between with the swatches in the footer. The choice is saved in `localStorage` under `tow-theme`.

- **Ren** is the default. It has a warm off-white page with black type, lines and buttons. Its ring annotations are black and invert to white text on a black fill when interactive.
- **Supreme** has a red page with white type. The courses band is white with red type, and the Instagram section and footer are black. Ring annotations use the logo's blue.
- **Blå** has a blue page with paper-coloured type and a pink accent.

Themes map the palette primitives onto the `--t-*` roles:

- `--t-page`, `--t-fg`, `--t-accent`
- `--t-btn-bg`, `--t-btn-fg`
- `--t-courses-*`, `--t-insta-*`, `--t-footer-*`

Rules (`--color-rule-subtle` / `--color-rule` / `--color-rule-strong`) are mixed from `currentColor`, so they follow any theme without per-theme values.

Known issue: Supreme's white on red is 4.38:1, just below the 4.5:1 WCAG AA minimum for body text. The red is a fixed brand colour.

## Typography

Titles and interface text use Jost. In the site frame every heading is heavy italic. Sentences use EB Garamond with `font-size-adjust: var(--font-text-adjust)`, so its lowercase matches Jost's.

| Size | Use |
|---|---|
| `--font-size-xs` | Uppercase labels and fine print |
| `--font-size-sm` | Metadata and ledger rows |
| `--font-size-base` | Body text |
| `--font-size-lg` | Lead text |
| `--font-size-xl` | Product names and prices |
| `--font-size-display` | Section and page headings |
| `--font-size-mega` | The mobile menu |

Line heights are display 0.9, tight 1.1 and normal 1.5. Tracking is tight −0.02em for headings, and wide 0.04em or wider 0.09em for uppercase.

## Rhythm

Two tokens set every vertical gap between blocks:

- **`--space-section`** (64 → 96px, fluid) is the padding at the top and bottom of every section, the gap between major blocks on content pages, and the bottom padding of each page.
- **`--space-page-top`** (128 → 192px, fluid) is the gap that clears the floating header at the top of content pages.

Inside sections, use steps from the spacing scale:

- 24px between a heading and its text.
- 32px after a rule before a new block.
- 8px between ledger rows and between a label and its value.

Neighbouring steps are always clearly different, and no value sits between two steps.

## Layout

Content sits within `--layout-site-width` (1500px). The side gutter is `--layout-gutter`. Full-bleed sections pad their content with `--layout-edge` so it lines up with the rest of the page. Two-column grids are separated by `--grid-gutter`. Running text uses `--measure` (44ch) or `--layout-content-width` (62ch).

Breakpoints:

- **700px (phone):** the burger menu appears, and grids drop to one or two columns.
- **900px (tablet):** two-column pages stack.
- **1100px (desktop):** the hero geometry changes.
- **820px, hero only:** the hero also switches here, because the letters sitting in front of the fingers are tuned to the photo.

## Shapes, depth and motion

- **Corners:** everything is square (`--radius`). The theme swatches use `--radius-full`.
- **Shadows:** the only shadows are the ones cast by the ring renders (`--shadow-object`, and `--shadow-object-soft` on flat colour).
- **Opacity:** three steps: `--opacity-muted` (0.8), `--opacity-subdued` (0.5) and `--opacity-disabled` (0.35).
- **Icon buttons:** `--size-control` (44px, the minimum touch target).
- **Motion:** uses `--transition-fast`, `--transition-normal` and `--transition-slow`.

## Components

- **Site frame:**
  - The header has the logo and nav, with a burger menu at 700px and below.
  - The footer has the logo, nav, contact details and theme swatches.
- **Hero:** the four-line headline, with the photo of hands hanging into it. Two rings are annotated with hand-drawn loops that link to their product pages.
- **Product carousel:** ring renders on the page colour.
  - On hover, the name grows into the photo and a drawn floral frame appears.
- `/smycken` shows the same cards as a grid.
- **Courses teaser:** a photo slider on one half and the course text, dates and booking button on the other.
- **Course signup:** a full-width black form band with white fields and controls, distinct from the surrounding editorial page.
- **Instagram:** four photos. The handle sticks beside them as you scroll.
- **Content pages** (`pages.css`): `.pg` page padding, a heading, a ledger of facts, one filled button, and `.pg__band` for full-bleed bands.

## Do's and don'ts

- Do use tokens for every repeatable colour, size, space, rule, radius, shadow, opacity and duration. If a token is missing, add it to `tokens.css`.
- Do keep Swedish copy factual, direct and understated.
- Do keep image collections at two columns on the smallest screens.
- Don't add values between the scale's steps.
- Don't add rounded ecommerce cards, badges, invented claims or decorative UI chrome.
- Don't start content pages with a page-name title.
