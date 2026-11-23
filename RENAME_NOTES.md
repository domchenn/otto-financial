# Otto → Porter: names intentionally left

Everything users see says **Porter**. The names below still say `otto` on purpose: renaming them
breaks installed builds, sign-in or deploys, or needs a migration. Change one only after deciding
to, and update this file when you do. Spec: `docs/Porter-handoff/PORTER_HANDOFF.md` §1.

## Kept, because renaming breaks something

| Name | Where | Why it stays |
|---|---|---|
| `com.dominicchen.otto` | `apps/mobile/app.json` (iOS bundle ID, Android package) | New bundle ID = new app record, new push certs, reinstall; Clerk redirects use it |
| `otto` slug and URL scheme | `apps/mobile/app.json` | EAS project and Clerk OAuth redirects (`otto://`) depend on them |
| `OTTO_*` settings | `backend/app/core/config.py`, `.env*.example`, Terraform, Makefile | Every deployed Lambda and local `.env` reads these names |
| `otto`, `otto_test`, `otto_live` databases and the `otto` role | `compose.yaml`, CI, Makefile, `config.py` | Renaming needs a dump/restore; local data lives there |
| `otto-*` AWS resources, `/otto/<env>` SSM paths, `otto-tf-state-*` bucket | `infra/` | Renaming applied Terraform resources destroys and recreates them |
| `infra/modules/otto` | `infra/` | Module path is part of Terraform state addresses |
| `otto-backend`, `otto-mobile` package names | `backend/pyproject.toml`, `apps/mobile/package.json` | Internal only; renaming churns lockfiles for no user benefit |
| `otto` Docker user | `backend/Dockerfile` | Internal only |
| `otto.appearance` storage key | `apps/mobile/src/theme/appearance.ts` | Renaming resets everyone's saved light/dark choice |
| `https://clerk.otto.test` | `backend/tests/conftest.py` | Fake issuer in tests; never shown to anyone |
| Repo `otto-financial` | GitHub | Renaming the repo changes clone URLs and CI links |
| Alembic migrations | `backend/alembic/versions/` | History is never edited |
| ADRs | `docs/adr/` | Historical records |
| `docs/prd.html` | `docs/` | Kept as the Otto v1 PRD, marked superseded |

## Renamed with a setting

| Name | Where | Note |
|---|---|---|
| Plaid Link app name | `OTTO_PLAID_CLIENT_NAME` (default `Porter`) | What Plaid Link shows ("Porter uses Plaid…"). The setting name keeps the `OTTO_` prefix like every other setting. |
