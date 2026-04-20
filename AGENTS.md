# TO.W — Agent Context

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If 200 lines could be 50, rewrite it.

## 3. Surgical Changes
Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Every changed line should trace directly to the request.

## 4. Goal-Driven Execution
Define success criteria. Loop until verified.
- Transform tasks into verifiable goals before starting.
- For multi-step tasks, write a brief plan and confirm before executing.

## Red Lines
Require explicit approval — never do these autonomously:
- `rm -rf` or any recursive delete
- Force push (`--force`, `-f`)
- Direct commits or merges to `main`/`master`
- Secrets in version control
- Bypassing pre-commit hooks (`--no-verify`)

## Design Tokens — Non-Negotiable
- All colors, spacing, typography, border-radius, and shadows live in `src/styles/tokens.css`.
- Reference tokens like `var(--color-text-primary)`, never hardcoded values.
- If a token doesn't exist, ask before creating one.

---

# Repository Guidelines

## Project Structure & Module Organization

This is a small Astro + TypeScript site. Source lives under `src/`.

- `src/pages/` contains route-level Astro pages such as `index.astro`, `shop.astro`, and `cart.astro`.
- `src/layouts/BaseLayout.astro` defines the shared shell, navigation, footer, and cart-count script.
- `src/components/` contains reusable UI, currently `ProductCard.astro`.
- `src/data/products.ts` stores product data and helpers such as price formatting.
- `src/scripts/cart.ts` contains browser cart logic backed by `localStorage`.
- `src/styles/global.css` contains global resets and base styles.
- `public/` contains static assets. `dist/` is generated build output; do not edit it by hand.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Astro development server.
- `npm run build` builds the production site into `dist/`.
- `npm run preview` previews the built site locally.
- `npm run astro -- check` runs Astro and TypeScript checks using the strict config.

Run commands from the repository root.

## Coding Style & Naming Conventions

Use Astro components for markup, TypeScript for browser or data logic, and plain CSS for global styling. Follow the existing style: two-space indentation, double quotes in TypeScript and Astro frontmatter, semicolons in TypeScript, and descriptive camelCase names such as `getCartCount`.

Name Astro components in PascalCase, for example `ProductCard.astro`. Name route files by URL segment in lowercase, for example `shop.astro`. Prefer the configured `@/*` alias for longer imports, but keep short relative imports when clearer.

## Testing Guidelines

No test runner is currently configured. Before submitting changes, run `npm run astro -- check` and `npm run build`. For cart behavior, manually verify add, update, remove, clear, and page refresh flows because the cart uses `window.localStorage`.

If tests are added later, place them next to covered code or in `tests/`, and use names like `cart.test.ts`.

## Commit & Pull Request Guidelines

This checkout does not include Git history, so no project-specific convention can be inferred. Use short, imperative commit messages, for example `Add cart quantity controls` or `Fix product price formatting`.

Pull requests should include a summary, commands run, browser checks, and screenshots for UI changes. Link issues when available and call out changes to product data, storage keys, or routes.

## Security & Configuration Tips

Keep browser-only code guarded during server rendering; `src/scripts/cart.ts` already uses `isBrowser()`. Do not commit secrets or environment-specific configuration. Treat `localStorage` data as untrusted and validate parsed values.
