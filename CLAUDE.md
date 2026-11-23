# Porter

Porter (briefly called Otto) is a personal, iPhone-first finance app. Dominic is the only user and the only contributor.

Everything users see says Porter. Infrastructure identifiers keep the Otto name: repo `otto-financial`, bundle ID `com.dominicchen.otto`, URL scheme `otto`, backend package `otto-backend`, `OTTO_*` settings, the `otto` database and `otto-*` AWS resources. `RENAME_NOTES.md` lists every name intentionally left. Changing the bundle ID or scheme affects Clerk redirects and installed builds, and renaming applied Terraform resources recreates them, so ask first.

## Key docs

- `docs/Porter-handoff/PORTER_HANDOFF.md`: product spec, design language and build order (source of truth for scope and UI); screens in `docs/Porter-handoff/png/` and `html/`
- `docs/prd.html`: the Otto v1 PRD, superseded but kept for history
- `README.md`: setup and commands
- `docs/adr/`: architecture decisions
- `TODO.md`: the backlog, in priority order. Local only (gitignored), so it never conflicts
  between branches. Update it when work lands or new follow-ups come up; follow-ups that
  reviewers need go in the PR description.

## Layout

- `apps/mobile`: Expo SDK 58, Expo Router, Clerk (`@clerk/expo`). Design tokens in `src/theme/tokens.ts`.
- `backend`: FastAPI modular monolith, SQLAlchemy 2, Alembic, Postgres. Runs on AWS Lambda.
- `infra`: Terraform (`shared`, `envs/staging`, `envs/prod`).

## Git rules (strict)

- Commit only as the configured git user. Never change the author or committer.
- Never add `Co-Authored-By`, "Generated with Claude Code", session links or any other AI attribution to commits, PRs or comments.
- Never push, open PRs or comment on GitHub unless explicitly asked.
- Always work on a feature branch, never directly on `main`. `main` is protected: changes land only through a PR with green CI.
- One PR per feature or fix. Stack a PR on its parent branch when it depends on unmerged work.
- Commit early and often: one commit per logical step (a component, a screen, a fix, a test suite) as soon as it works and its checks pass, not one large commit at the end. Each commit message says what changed and why.
- PR descriptions say what changed, how it was tested (checks run, what was and wasn't verified on a device) and anything left for later.

## Checks before finishing a change

- backend (`backend/`): `uv run ruff format --check . && uv run ruff check . && uv run mypy app tests && uv run pytest`
- mobile (`apps/mobile/`): `npx prettier --check "src/**/*.{ts,tsx}" && npx eslint . && npx tsc --noEmit && npx jest`
- infra (`infra/`): `terraform fmt -check -recursive`

## Tests

Every PR that changes behavior includes tests; CI runs them on every PR.

- New logic (money math, parsing, matching, budget/credit rules) gets unit tests. Backend uses pytest; mobile uses Jest (`jest-expo`).
- New or changed mobile screens and components get React Native Testing Library tests for the key behavior: what the user sees and what tapping does. Query by role and text, not test IDs. RNTL v14 `render` and `fireEvent` are async, so `await` them.
- Bug fixes start with a failing regression test.
- Mobile tests sit next to the code as `*.test.ts(x)`. Screen tests go in `src/__tests__/`, never in `src/app/` (Expo Router would treat them as routes).
- Sample data must stay internally consistent (totals match their parts); `src/lib/sample.test.ts` enforces it.

## Conventions

- Money is stored as integer cents.
- Bank data goes through a `FinancialDataProvider` adapter.
- UI follows the handoff's design system (`docs/Porter-handoff/PORTER_HANDOFF.md` §4): Plus Jakarta Sans, white ground with gray surface cards, ink primary buttons (one per screen or approval row), sage for Ask, links, positive states and the live dot, terracotta only for overspend and expiring, category tints only with their fixed meaning (mint groceries/budget, butter dining/credits, sky travel/payments, blush shopping, lilac other/investing/points). No sparkle icon for AI (use `LiveDot`/`LiveLabel`), no boxed answer cards, no black hero cards, shadows only on floating things, no gradients except card-art metal. Text and backgrounds stay at 4.5:1 (`src/theme/tokens.test.ts`). Build screens from `src/components` and the tokens; use the `StepScreen` (Template B) or `MomentScreen` (Template A) layouts.
- Sample data for screens lives in `apps/mobile/src/lib/sample.ts` until the real APIs land; replace it screen by screen.
- Use `npx expo install` for Expo packages, and check the installed types: Expo APIs change every SDK.
- Ask before adding dependencies or anything that costs money on AWS.

## Workflow

For any non-trivial task, use the `clarify-first` skill before writing code.
