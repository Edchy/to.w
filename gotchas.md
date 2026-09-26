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
