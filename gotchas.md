# Gotchas

_Log mistakes and hard-won lessons here so they don't repeat._

- Astro `import.meta.env.BASE_URL` may not include a trailing slash for GitHub Pages `base`; normalize it before concatenating internal links.
- Content collection image paths in `data.json` are resolved relative to that product folder. Cross-product image names in another folder will break `astro build`.
