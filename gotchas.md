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
