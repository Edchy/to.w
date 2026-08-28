# Gotchas

_Log mistakes and hard-won lessons here so they don't repeat._

- Astro `import.meta.env.BASE_URL` may not include a trailing slash for GitHub Pages `base`; normalize it before concatenating internal links.
- Content collection image paths in `data.json` are resolved relative to that product folder. Cross-product image names in another folder will break `astro build`.
- Keep typed helper objects in Astro frontmatter, not inside JSX expressions. A `Record<...>` declaration inside a render callback can be parsed as markup and break the Vite build.
- Keep imported image extensions lowercase. Astro can render an uppercase `.JPG` import, but `astro check` does not provide a matching module declaration for it.
- This repo has no `check` npm script; run `npm run astro -- check`.
- Astro's CLI entry point is `node_modules/astro/bin/astro.mjs`; use that path when invoking it directly with a specific Node binary.
- `sips` can crash when a single metadata query mixes JPEG and AVIF inputs; inspect those formats separately or use `ffprobe`.
- Do not combine nested lead grids with CSS multi-column flow to fake a spanning homepage card; it breaks reflow and can create horizontal overflow. Use one responsive CSS Grid with explicit spans.
- When a grid card is itself a `<figure>`, reset margin on the card (`.work-card { margin: 0; }`); a descendant selector such as `.work-card figure` does not remove the browser's default figure margins from that outer element.

## Replace a file in two patch operations

`apply_patch` does not accept deleting and adding the same path in one patch. Delete the file first, then add the replacement in a second operation.
