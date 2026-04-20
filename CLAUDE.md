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

## Red Lines
Require explicit approval — never do these autonomously:
- `rm -rf` or any recursive delete
- Force push (`--force`, `-f`)
- Secrets in version control

## Planning
- Plan before any task with 3+ steps or architectural impact.
- Write the plan out. Confirm before executing.
- If something breaks: stop, re-plan, then continue.
- Log mistakes and lessons in `gotchas.md`.

## Task Loop
Plan → Verify inputs → Execute → Explain changes → Capture lessons

## Quality
- Root-cause every bug. Symptoms are not solutions.
- Verify before done: UI looks correct.

## Design Tokens — Non-Negotiable
No hardcoded values for any repeatable visual pattern. Ever.
- All colors, spacing, typography, border-radius, and shadows live in `tokens.css` as CSS variables.
- If a value appears more than once, it gets a token.
- If a token doesn't exist for what you need, ask if you may create it in `tokens.css` — don't hardcode.
- Reference tokens like: `var(--color-brand-primary)`, never `#3B82F6`.
- The only acceptable hardcoded values are one-off layout hacks that will never repeat.

## This Project
- **Name:** TO.W
- **What it is:** A personal website for an artist.
- **Tier:** Personal
- **Stack:** Astro + TypeScript
