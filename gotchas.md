# Gotchas

_Log mistakes and hard-won lessons here so they don't repeat._

- Astro `import.meta.env.BASE_URL` may not include a trailing slash for GitHub Pages `base`; normalize it before concatenating internal links.
- Content collection image paths in `data.json` are resolved relative to that product folder. Cross-product image names in another folder will break `astro build`.
- Keep typed helper objects in Astro frontmatter, not inside JSX expressions. A `Record<...>` declaration inside a render callback can be parsed as markup and break the Vite build.
- Keep imported image extensions lowercase. Astro can render an uppercase `.JPG` import, but `astro check` does not provide a matching module declaration for it.
- This repo has no `check` npm script; run `npm run astro -- check`.
- Astro's CLI entry point is `node_modules/astro/bin/astro.mjs`; use that path when invoking it directly with a specific Node binary.
- `sips` can crash on some AVIF metadata queries (including archived product assets), as well as when a query mixes JPEG and AVIF inputs; use `ffprobe` for AVIF dimensions and pixel format.
- Do not combine nested lead grids with CSS multi-column flow to fake a spanning homepage card; it breaks reflow and can create horizontal overflow. Use one responsive CSS Grid with explicit spans.
- When a grid card is itself a `<figure>`, reset margin on the card (`.work-card { margin: 0; }`); a descendant selector such as `.work-card figure` does not remove the browser's default figure margins from that outer element.

## Replace a file in two patch operations

`apply_patch` does not accept deleting and adding the same path in one patch. Delete the file first, then add the replacement in a second operation.

## `scroll-behavior: smooth` on `html` breaks back-navigation with ClientRouter

Astro's `<ClientRouter />` restores scroll position on `popstate` with `scrollTo()`.
With `scroll-behavior: smooth` on `html` that restore becomes an animated scroll —
on mobile it reads as "the back button did nothing", and any touch during the
animation cancels it, leaving the page at the wrong offset. Scope smooth scrolling
to anchor jumps (`:has(:target)`) instead of putting it on `html`.

Related: a scroll-lock helper that calls `window.scrollTo(0, savedY)` on unlock must
NOT do so during `astro:after-swap` — the router owns scroll position on a page
change, and restoring the previous page's offset fights it.
# 2026-09-23

- In zsh, `status` is a reserved read-only parameter. Use a task-specific name such as `http_code` in route-check scripts.
- In zsh, an unmatched file glob aborts the command. Use `find` or enable an explicit null-glob behavior when a file type may be absent.

# 2026-09-24

- A hero built from a fixed `padding-top` plus a `70svh` band is taller than the viewport, so text anchored to the band's bottom falls below the fold. Give the hero `height: calc(100svh - header)` as a flex column and let the band take `flex: 1`.
- Two positioned elements with the same `z-index` paint in DOM order. A cutout image placed after the header with the same `--z-raised` covers the nav at narrow widths. Put the image at `--z-base` after the content it should overlap, so the header stays on top.
- The Astro dev server caches a failed import. If `index.astro` imports a component before that file exists, the page keeps showing `FailedToLoadModuleSSR` after the file is created. Write new component files before adding their imports, or `touch` the importing file to clear it.
- Astro's scoped CSS does not compile `:global()` inside `:has()`; it is left as literal, invalid CSS and the rule silently never matches. `<Image>` from `astro:assets` does receive the component's scope attribute, so a plain `:has(.class)` works for it.
- After a component file is rewritten wholesale, the Astro dev server can keep serving that component's *old* `<style>` block with the new markup, so the page looks unstyled. Check `…Component.astro?astro&type=style&index=0&lang.css`, and `touch` the file to force a recompile.

# 2026-09-26

- The stale-`<style>` problem above is not limited to wholesale rewrites: small in-place shell edits (`sed -i`, `perl -pi`, a `cp` over the file) trigger it too. The page markup updates but the style module keeps the old CSS, so a CSS change looks like it "did nothing" until the server restarts. After editing an `.astro` file from the shell, wait a second, `touch` it (a touch in the same second as the edit can be missed too), then confirm with `curl …Component.astro?astro&type=style&index=0&lang.css | grep <new selector>`.
- It is not only shell edits: two quick Edit-tool edits to the same `.astro` file (markup, then `<style>`) also left the old CSS in place. After any `<style>` change, check the served CSS for the new selector before looking at the page; if it is missing, wait a second and `touch` the file.
- In this shell, `grep` is a wrapper function, not the real binary, and `-r` searches through it can silently return nothing. Use `command grep` for anything that decides what is "unused". zsh also does not word-split `$VAR`, so `grep -r x $PATHS` searches one nonexistent path; use an array, or do inventories in a small Python script.
- Image inventories: match on the file's basename across every file that stays (pages, layouts, kept components, `src/data`, `src/content/**/data.json`), and remember `import.meta.glob` folders (e.g. `src/assets/img/kurser/`) use files without naming them.
- Slot content keeps the scope of the component that wrote it, not the wrapper it lands in. A wrapper (`SiteFrame`) that spreads `{...rest}` onto its root receives the caller's `data-astro-cid-*`, so the caller's scoped selectors on that root (`.a10--ren .a10__line`) keep working. Rules in the wrapper that target slotted elements need `:global()`, and they can tie on specificity with the caller's own rules; then stylesheet order decides, so drop the now-redundant declaration in the caller rather than escalating.
- When moving markup between files by line ranges, check that closing tags came along: a missing `</div>` silently swallowed the whole homepage into the hidden mobile menu. A computed-style fingerprint of every element (before/after, per theme) caught both slips.
- `cqi` in a custom property resolves where the property is *used*. For a grid whose `grid-template-columns` and cards both use `--card-w`, set the container on the grid's parent and define `--card-w` on both the track and the cards.
- The logo SVGs are a vector "to.w" path over an embedded **WebP** cheetah (480×293 px). `sharp` (librsvg) renders the SVG but silently drops the WebP, leaving only the lettering. Convert the embedded image to PNG before rasterising. The cheetah is also low-res: past ~1.5× its native size it goes soft.
- Cross-document view transitions: (1) Chrome never runs them in a hidden tab, and the Claude-in-Chrome automation window counts as hidden. To see one, drive headless Chrome over CDP (`--headless=new --remote-debugging-port`), record `Page.startScreencast` frames, and log `pageswap`/`pagereveal` `e.viewTransition`. (2) `display: none` on a `::view-transition-old(...)` pseudo makes Chrome abort the whole transition ("ViewTransition opt-in disabled"); hide it with `opacity: 0` instead. (3) Give a `view-transition-name` only to the element that should travel: names on every card made all the other names fly across the page to their twins in "Fler smycken". (4) A whole-page cross-fade of two different layouts reads as a glitch; swap `root` instantly.

- Unregistered custom properties are substituted where they are used, so a token like `--color-rule: color-mix(in oklch, currentColor 35%, transparent)` or `--layout-edge: max(…, (100% - …) / 2)` resolves against the element that reads it. That is what lets one rule token follow every theme.
- `sips --cropOffset` is ignored with `--cropToHeightWidth` (it crops from the centre), and the system Python's PIL is built for x86_64. To inspect part of a screenshot, clip it in Chrome's `Page.captureScreenshot` instead.
- Hero headline letters raised in front of the hands (`z-index: var(--z-raised)`) also sit in front of the ring labels, which live inside the hands' stacking context and so can't be raised above them. On short, wide screens the glimpse label rose under "i återvunnet" and the letters took its clicks. The letters are decorative (the h1's aria-label carries the text), so they have `pointer-events: none`. To find blocked links, hit-test with `document.elementFromPoint` across many viewport sizes; they only fail at some sizes.

# 2026-09-27

- JavaScript does not allow a unary minus directly before an exponentiation expression (`-x ** 2`). For Gaussian mesh profiles, wrap the power first: `Math.exp(-(x ** 2))`.
- Astro 6's CLI entrypoint is `node_modules/astro/bin/astro.mjs`, not `node_modules/astro/astro.js`; use the package script or the `.mjs` path when pinning Node 22.
- When a rule needs extra specificity to beat another (e.g. `.a10.a10 .a10__hero h1` over the frame's heading rule), put only the properties that need winning in it. A `font-size` in that rule also outranked the hero's per-breakpoint `--fs` sizes, so the headline shrank on every screen up to 1100px while desktop looked fine. Compare computed sizes against the reference page at several widths, not just desktop.
- The footer's full-bleed background is a 100vmax box-shadow trimmed by `clip-path: inset(0 -100vmax)`, which also clips anything positioned outside the footer's own height. A decoration standing on its top rule (the cheetah) measured correctly but never showed. Keep such decorations inside the footer's box (e.g. in its top padding) or on a wrapper outside the clipped element.

# 2026-09-28

- Decorative divider comments are brittle `apply_patch` anchors. Match the functional selector and declarations when changing a scoped CSS block.
- When hero annotation copy changes, preserve the annotation's visual grammar unless the user explicitly asks to redesign it: the dot, wiggly stem, and hand-drawn loop are the feature. Replacing them with detached editorial text changes the concept, not just the wording.
- A breakpoint used only for per-letter z-index weaving must not also introduce a different headline size or vertical-position formula. Keep geometry continuous across that boundary and switch only the layer map, otherwise a one-pixel viewport change visibly jumps the entire hero.
- Do not use `orientation` to select the 501–819px hero composition: resizing a desktop browser crosses portrait/landscape when width happens to exceed the available height, creating a phantom breakpoint unrelated to the design. Keep that range width-driven; reserve orientation-specific rules for compact phone landscape only.
- Multi-file `apply_patch` changes fail atomically when one file's anchor is stale. Inspect the exact target blocks first and split unrelated file edits when one selector has moved.
- Repeated full-page Chrome screenshots can exhaust the temporary volume during responsive QA. Reuse one capture or run later viewport audits as DOM measurements without writing another image.

# 2026-09-29

- `<model-viewer loading="lazy">` inside a `display: none` container never loads after it's shown, so the "Vrid i 3D" view stayed blank. Leave `loading` at its default when the model starts hidden. Also, the automation Chrome window reports `visibilityState: hidden`, so WebGL never paints in its screenshots. Check `mv.loaded` instead of trusting an empty frame.

# 2026-10-10

- The Claude-in-Chrome window will not resize below desktop width, so a 390px `resize_window` still renders the desktop layout. For phone checks, replace a same-origin page's markup with 390px-wide iframes of the pages and read `scrollWidth` against `clientWidth` inside each one to find horizontal overflow.
- Dev-server HMR reloads the page you injected test helpers into after any CSS edit, so functions set on `window` disappear. Inject on `/robots.txt` (no HMR client) instead.

# 2026-10-10 (variant studies)

- When pruning CSS rules for removed classes with a script, never delete a whole rule because a dead class appears inside `:is(...)` or a selector list next to live ones. It silently removed phone layout rules shared by the product and about pages (and Spec's tablet band) and only showed up as sideways scroll on phones. Remove the dead name from the list instead, and re-run the phone overflow check after any prune.
- In OKLCH, `color-mix()` interpolates hue: mixing a near-white (hue ~95) with blue swung through yellow-green and produced an olive tint. Mix pale tints in `oklab`.
- model-viewer sets its own `height: 150px` and a loading bar on `:host`; set `height: auto` with an `aspect-ratio`, and `--progress-bar-color: transparent`.

# 2026-10-11 (cleanup)

- Finding unused assets by grepping filenames is not enough. The course photos load through `import.meta.glob` (CoursesTeaser), the 3D models and studio lights go by names built in code (`models/${look.model}.glb`, `env/page-${name}.hdr`, product slugs on /v/0), and the wordmark SVG is only named in a comment because its paths are inlined. Trace those before moving anything, then compare the built page list and every `/models/`, `/env/`, `/video/` path in `dist` against the files on disk.
- Chrome skips a cross-document view transition when the tab is hidden or when the new page takes more than ~4s. In dev, the first visit to a page is slow while it compiles, so test transitions on a second visit.
- A grid made with `display: grid` and no `grid-template-columns` gets one `auto` column, which grows to its widest content instead of the viewport. The About page's min-100vh grid did that and pushed the header (and "Meny") 14px right on phones. Give such grids `grid-template-columns: minmax(0, 1fr)`.
- v5's 12-column grids (`.v-pd`, `.v-about`) keep their 11 gaps even when every item spans 1 / -1, and 11 × 32px gaps are wider than phones under ~376px. Collapse to one column where everything stacks.
- model-viewer 4.3.1 and 4.4.0: setting `orientation` calls `arRenderer.onUpdateScene()` outside AR, which throws before `$needsRender()`, so a ring tilted by script never visibly moves (the attribute changes, the pixels don't). TurningRing makes that call a no-op unless an AR session is presenting. To check the ring for real, drive headless Chrome over CDP (it counts as visible and renders WebGL with SwiftShader) and compare screenshots of the ring, not its `orientation` attribute; the automation tab is hidden and never renders it.
- `git mv` and `git rm` stage immediately, so a later `git add <one file> && git commit` also commits them, under the wrong message. And `git add -A <dir>` sweeps in the user's own uncommitted deletions (it took two product photos still listed in data.json, breaking the build). Check `git diff --cached --stat` before every commit, and `git status` for changes that aren't ours.
