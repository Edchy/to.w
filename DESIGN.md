---
schemaVersion: 2
name: TO.W
tokens:
  colors:
    paper: "--v-warm-paper, a warm off-white page"
    ink: "--v-ink, near-black type and rules"
    accent: "--logo-blue, the one colour: the new-pieces band, buttons, accents in headlines"
  typography:
    display: "Instrument Serif (names, headings, the hero line)"
    text: "IBM Plex Mono at one small size for nearly everything else"
  rounded: "square everywhere (--radius: 0)"
  spacing: "4px base: 4 · 8 · 16 · 24 · 32 · 48 · 64 · 96"
components:
  - frame
  - hero
  - new-pieces
  - selection
  - course-teaser
  - instagram
  - shop
  - product
  - courses
  - about
---

# TO.W design system

Every value lives in `src/styles/tokens.css`. Components never hardcode a repeatable value. The look is a museum catalogue: small mono type, serif names, warm paper with generous room, and colour only where it means something.

The styles live in `src/styles/v/`: `base.css` (shared structure), `v5.css` (the look) and `footers.css`. Their selectors key on data attributes that `VFrame.astro` stamps on `.v` as fixed values (`data-v="5"`, `data-base="13"`, `data-font="serif"`, `data-footer="center"`). The names are left over from the design studies the site grew out of.

## Colour

Section 4 of `tokens.css` maps the palette onto the `--v-*` roles: `--v-paper`, `--v-fg`, `--v-accent`, `--v-on-accent`, plus mixes for panels (`--v-tint`), hovered buttons (`--v-accent-deep`) and secondary text (`--v-fg-muted`).

- The page is warm paper with ink type.
- The logo blue fills the "Nyheter" band and the buttons, and marks the accent words in headlines.
- The workshop film and the portrait on the About page are black and white.

Rules (`--color-rule-subtle` / `--color-rule` / `--color-rule-strong`) are mixed from `currentColor`, so they follow whatever they sit on.

## Typography

Instrument Serif (`--v-display`) sets names, headings, the hero line and the footer email. IBM Plex Mono (`--v-text`) sets everything else at `--font-size-sm`. Links in the header, menu and footer are set in small capitals.

| Size | Use |
|---|---|
| `--font-size-xs` | Labels and fine print |
| `--font-size-sm` | Running text (mono) |
| `--font-size-base` | The header's page links |
| `--font-size-lg` | The homepage hero line |
| `--font-size-xl` | Product names, the About intro, the footer email |
| `--font-size-display` | The About headline |
| `--v-size-title` | Product page titles |

Line heights are display 0.9, tight 1.1 and normal 1.5. Tracking is tight −0.02em for large serif type and wide 0.04em for small capitals.

## Layout and rhythm

Content sits within `--v-site-width` (80rem) with `--v-gutter` at the sides. Pages build on 12-column grids separated by `--grid-gutter`. Homepage sections are separated by `--v-section`.

Breakpoints:

- **700px (phone):** grids drop to two columns, and lead photos are capped in height.
- **900px (tablet):** the "Meny" button replaces the header links, and two-column pages stack. Stacked 12-column grids collapse to one column, because twelve columns' gaps alone are wider than a phone.
- **1100px:** the product grid goes from four columns to three.

## Shapes, depth and motion

- **Corners:** everything is square (`--radius`).
- **Touch targets:** `--size-control` (44px).
- **Transitions:** `--transition-fast`, `--transition-normal` and `--transition-slow`.
- **Page changes** (view transitions, `global.css`): the old page fades out, the new one fades in and rises slightly, and the header stays put. A product card's photo grows into the big photo on its page.
- **The 3D ring:** fades in over `--duration-reveal` once it has loaded.
- **Reduced motion:** transitions are switched off, the ring stands still, and the About film holds on its poster.

## Components

- **Frame (`VFrame.astro`):**
  - The header has the wordmark and three page links. At 900px and below, a full-screen menu opens from "Meny".
  - The footer is centred: the email in large serif, the page links, Instagram and the credit. On desktop, Tove's bird sits on its top line.
- **Hero:** the turning silver band (`TurningRing.astro`, a 3D model engraved with a line of Karin Boye) with "Handgjorda smycken i återvunnet silver" under it like a caption. `/v2/` tries the split layout instead: the line as a headline at the left and the ring in a pale panel at the right.
- **Nyheter:** a blue band with the new pieces, each with a small photo, its description and price.
- **Selection:** four pieces as cards, then "Alla smycken".
- **Course teaser** and **Instagram** close the homepage.
- **Smycken:** the first row of cards, then how ordering works, then the rest.
- **Product page:** a 4:5 lead photo with thumbnails, the name, price, text, a ledger of facts and the order button (an email).
- **Kurser:** course cards beside the interest form.
- **Om:** laid out like a newspaper front page. Tove's greeting is the headline over a double rule, the film is the lead picture with the intro beside it, and the rest runs in three ruled columns with her portrait.

## Do's and don'ts

- Do use tokens for every repeatable colour, size, space, rule, radius and duration. If a token is missing, ask before adding it to `tokens.css`.
- Do keep Swedish copy factual, direct and understated.
- Do keep image collections at two columns on the smallest screens.
- Don't add values between the scale's steps.
- Don't add rounded ecommerce cards, badges, invented claims or decorative UI chrome.
- Don't start content pages with a page-name title.
