---
name: project-init
description: Project kickoff. Pick a tier, ask the right questions, generate CLAUDE.md, AGENTS.md, design tokens, and project files. Load this at the start of every project.
---

# Project Init

Use this at the start of any new project. It sets up the right guardrails and files based on how serious the project is. Run it once, then never think about setup again.

---

## Step 1 — Ask the Questions

Use `AskUserQuestion` to gather context. Keep it to the minimum needed for the tier.

**Round 1 — always ask these two:**
1. **Tier** (single choice): Explore / Personal / Public
2. **What are we building?** — name + one sentence

**Round 2 — only if Personal or Public:**
3. **Tech stack?** — framework, language, key integrations
4. **UI project?** — does it have a frontend that needs design tokens (yes/no)

**Round 3 — only if Public:**
5. **Any process requirements?** — CI/CD, deployment target, who reviews code

Do not ask more than needed. If tier is Explore, two questions is enough.

---

## Step 2 — Write CLAUDE.md

Write `CLAUDE.md` to the project root. Content is tier-dependent but always starts with the four principles.

### All tiers — include this block verbatim:

```markdown
# [Project Name] — Agent Context

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
Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

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
- "Add validation" → "Write tests for invalid inputs, then make them pass."
```

### Personal and Public — append these sections:

```markdown
## Red Lines
Require explicit approval — never do these autonomously:
- `rm -rf` or any recursive delete
- Force push (`--force`, `-f`)
- Direct commits or merges to `main`/`master`
- Secrets in version control
- Bypassing pre-commit hooks (`--no-verify`)

## Planning
- Plan before any task with 3+ steps or architectural impact.
- Write the plan out. Confirm before executing.
- If something breaks: stop, re-plan, then continue.
- Log mistakes and lessons in `gotchas.md`.

## Task Loop
Plan → Verify inputs → Execute → Explain changes → Capture lessons

## Quality
- Root-cause every bug. Symptoms are not solutions.
- Verify before done: tests pass, build succeeds, UI looks correct.
```

### If UI project (Personal or Public) — append this section:

```markdown
## Design Tokens — Non-Negotiable
No hardcoded values for any repeatable visual pattern. Ever.
- All colors, spacing, typography, border-radius, and shadows live in `tokens.css` as CSS variables.
- If a value appears more than once, it gets a token.
- If a token doesn't exist for what you need, ask if you may  create it in `tokens.css` — don't hardcode.
- Reference tokens like: `var(--color-brand-primary)`, never `#3B82F6`.
- The only acceptable hardcoded values are one-off layout hacks that will never repeat.
```

### All tiers — close with a project-specific section:

```markdown
## This Project
- **Name:** [project name]
- **What it is:** [one sentence]
- **Tier:** [Explore / Personal / Public]
- **Stack:** [tech stack or "TBD"]
```

---

## Step 3 — Write AGENTS.md

Write the exact same content as CLAUDE.md to `AGENTS.md`. This ensures the same rules apply regardless of which agent framework is reading the project.

---

## Step 4 — Create tokens.css (UI projects only)

If it's a UI project, create the design tokens file. Place it at:
- `src/styles/tokens.css` if a `src/` folder exists
- `tokens.css` in the project root otherwise

Copy the full starter from `templates/design-tokens.css`. Do not strip it down — the user customizes the values, not the structure.

After creating the file, tell the user where it was placed and that they should customize the values before building any components.

---

## Step 5 — Create Tier Files

### Explore
- `README.md` — what we're exploring, hypothesis, stack being tried, findings section (blank)

### Personal
- `README.md` — project name, what it is, how to run, tech stack
- `PRD.md` — fill with what was gathered: problem, audience, v1 scope. Leave user stories as bullet placeholders.
- `gotchas.md` — header only, one blank entry to start

### Public
- Everything from Personal
- `brand_assets/.gitkeep` — empty folder, keeps it in version control
- Add to `README.md`: deployment target, CI/CD approach, note: "Never commit directly to main"

---

## Step 6 — Report Back

After creating all files, give a short summary:

- Tier chosen and what that means
- List of files created
- Where tokens.css was placed (if applicable)
- One clear next step (e.g. "Customize the token values in tokens.css before writing any components")

No essay. Keep it tight.
