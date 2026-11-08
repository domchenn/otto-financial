# Otto

Otto (formerly Porter) is a personal, iPhone-first finance app. Dominic is the only user and the only contributor.

User-facing text says Otto. Code identifiers still say `porter` (repo, bundle ID `com.dominicchen.porter`, URL scheme, backend package, database, Terraform). Don't rename those without asking: the bundle ID and scheme affect Clerk redirects and installed builds, and Terraform renames recreate AWS resources.

## Key docs

- `docs/prd.html`: product spec (source of truth for scope and UI)
- `README.md`: setup and commands
- `docs/adr/`: architecture decisions

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
- UI follows PRD section 05 (Otto design language): Plus Jakarta Sans, warm off-white ground with white cards, indigo only for actions (one primary button per screen), pastels with fixed meanings (mint budget, lilac points, butter credits, sky payments), shadows only on floating things, no gradients. Build screens from `src/components` and the tokens; use the `StepScreen` (Template B) or `MomentScreen` (Template A) layouts.
- Sample data for screens lives in `apps/mobile/src/lib/sample.ts` until the real APIs land; replace it screen by screen.
- Use `npx expo install` for Expo packages, and check the installed types: Expo APIs change every SDK.
- Ask before adding dependencies or anything that costs money on AWS.

## Workflow

For any non-trivial task, use the `clarify-first` skill before writing code.
