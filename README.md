# Otto

A private, iPhone-first personal finance app: credit cards, points, expiring card credits,
weekly budgets and an assistant that explains it all in plain sentences. Otto was previously
called Porter. Product requirements: [`docs/prd.html`](docs/prd.html).

## Repository

| Path | What |
|---|---|
| `apps/mobile` | Expo (React Native) iOS app. Expo Router, Clerk auth, Face ID lock. |
| `backend` | FastAPI modular monolith. SQLAlchemy 2, Alembic, PostgreSQL. Runs on AWS Lambda. |
| `infra` | Terraform: `shared` (state, ECR, CI role, budget) and `envs/{staging,prod}`. |
| `docs` | PRD and architecture decision records. |

## Local development

Prerequisites: Docker, [uv](https://docs.astral.sh/uv/), Node 22, Xcode (for the iOS build).

```bash
# 1. Database
docker compose up -d

# 2. API  (http://localhost:8000/docs)
cd backend
cp .env.example .env          # fill in the Clerk values
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0

# 3. App (needs a development build: Face ID, blur and Clerk use native code)
cd apps/mobile
cp .env.example .env          # API URL = your Mac's LAN IP, plus the Clerk publishable key
npm install
npx expo run:ios --device     # or `npx expo run:ios` (`make sim`) for the iOS Simulator
```

### Clerk setup (one time)

1. Create a Clerk application with **Email** sign-in using **email verification code**.
2. Under *Restrictions*, enable **Restricted mode** so nobody else can sign up, then create
   your own user in the dashboard.
3. Put the publishable key in `apps/mobile/.env`, and the Frontend API URL plus your user ID
   in `backend/.env`.

### Plaid setup (one time)

1. Sign up at [dashboard.plaid.com](https://dashboard.plaid.com) and copy the **client ID** and
   **sandbox secret** into `OTTO_PLAID_CLIENT_ID` / `OTTO_PLAID_SECRET` in `backend/.env`.
2. Generate `OTTO_TOKEN_ENCRYPTION_KEY` (the command is in `.env.example`). Losing it means
   re-linking every bank, so keep a copy somewhere safe.
3. In the Plaid dashboard, add the iOS bundle ID `com.dominicchen.otto` under allowed apps.
4. Rebuild the dev build after pulling (`npx expo run:ios --device`): Plaid Link is native code.

In sandbox, Plaid never sends real texts: if Link asks for a phone number, use `415-555-0011`
with code `123456` (or skip that step). Then pick any non-OAuth bank and sign in with
`user_good` / `pass_good`. Work on the phone over your iPhone hotspot; campus Wi-Fi
(eduroam) usually blocks the phone from reaching the Mac.
Pull to refresh on Home, Wallet or a card to sync again (webhooks come later).

### Real bank data (Plaid Trial)

`make dev` always uses the sandbox. For your real accounts:

1. `cp backend/.env.live.example backend/.env.live` and paste the **Production** secret
   (Dashboard → Developers → Keys). The file is gitignored.
2. `make dev-live`. It creates the `otto_live` database on first run, migrates it and starts
   everything with Plaid Production. Sandbox data stays in `otto`; the two never mix.
3. Connect banks from the + on Wallet. Plaid's free Trial allows 20 connections.

Apple Card isn't available through Plaid; it needs FinanceKit (see the PRD).

If tests can't connect with `role "otto" does not exist`, another Postgres (e.g. Homebrew) is
holding `localhost:5432`. Stop it (`brew services stop postgresql@15`) or point
`OTTO_DATABASE_URL` / `OTTO_TEST_DATABASE_URL` at the container.

## Tests and checks

```bash
cd backend && uv run ruff check . && uv run mypy app tests && uv run pytest
cd apps/mobile && npx eslint . && npx tsc --noEmit && npx jest
```

CI runs all of these plus `terraform validate` on every pull request.

## Deploying to AWS

1. `cd infra/shared && terraform init && terraform apply -var github_repository=<owner>/<repo> -var budget_email=<you>`
2. In GitHub, add the repository variables listed at the top of `.github/workflows/deploy.yml`.
3. Create a free Neon project (one branch per environment), then store each connection string:
   `aws ssm put-parameter --name /otto/staging/database_url --type SecureString --overwrite --value 'postgresql+psycopg://…'`
4. Push to `main`. CI builds the image, deploys staging, runs migrations, smoke-tests, then
   waits for approval on the `prod` environment before promoting the same image.

See [ADR 0001](docs/adr/0001-serverless-baseline-with-scale-profile.md) for why the stack is
serverless.
