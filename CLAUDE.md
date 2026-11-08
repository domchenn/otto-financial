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
- Always work on a feature branch, never directly on `main`.

## Checks before finishing a change

- backend (`backend/`): `uv run ruff format --check . && uv run ruff check . && uv run mypy app tests && uv run pytest`
- mobile (`apps/mobile/`): `npx prettier --check "src/**/*.{ts,tsx}" && npx eslint . && npx tsc --noEmit`
- infra (`infra/`): `terraform fmt -check -recursive`

## Conventions

- Money is stored as integer cents.
- Bank data goes through a `FinancialDataProvider` adapter.
- UI follows PRD section 05 (Otto design language): Plus Jakarta Sans, warm off-white ground with white cards, indigo only for actions (one primary button per screen), pastels with fixed meanings (mint budget, lilac points, butter credits, sky payments), shadows only on floating things, no gradients. Build screens from `src/components` and the tokens; use the `StepScreen` (Template B) or `MomentScreen` (Template A) layouts.
- Sample data for screens lives in `apps/mobile/src/lib/sample.ts` until the real APIs land; replace it screen by screen.
- Use `npx expo install` for Expo packages, and check the installed types: Expo APIs change every SDK.
- Ask before adding dependencies or anything that costs money on AWS.

## Workflow

For any non-trivial task, use the `clarify-first` skill before writing code.
