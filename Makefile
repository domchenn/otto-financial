# Everyday commands. Run `make` (or `make help`) to list them.
#
#   make dev     database + API + Metro together; Ctrl-C stops all of them
#   make ios     rebuild and install the dev build on your iPhone (after native changes)

.DEFAULT_GOAL := help
.PHONY: help dev db api app ios migrate test check check-backend check-mobile check-infra

# The test database lives in the Docker container. OrbStack names it this way, which avoids
# the Homebrew Postgres that other projects use on localhost:5432.
TEST_DB := postgresql+psycopg://otto:otto@otto-financial-postgres-1.orb.local:5432/otto_test

help: ## List commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  make %-14s %s\n", $$1, $$2}'

dev: db migrate ## Start the database, API and Metro together (Ctrl-C stops all)
	@trap 'kill 0' INT TERM EXIT; \
	(cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0) & \
	(cd apps/mobile && npx expo start); \
	wait

db: ## Start Postgres (starts OrbStack first if needed)
	@docker info >/dev/null 2>&1 || (open -a OrbStack && until docker info >/dev/null 2>&1; do sleep 1; done)
	@docker compose up -d --wait postgres

api: db migrate ## Run only the API on :8000
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0

app: ## Run only Metro for the installed dev build
	cd apps/mobile && npx expo start

ios: ## Rebuild and install the dev build on your iPhone (after native changes)
	cd apps/mobile && npx expo run:ios --device

migrate: ## Apply database migrations
	@cd backend && uv run alembic upgrade head

test: db ## Run backend and mobile tests
	cd backend && OTTO_TEST_DATABASE_URL=$(TEST_DB) uv run pytest
	cd apps/mobile && npx jest

check: check-backend check-mobile check-infra ## Run every check CI runs

check-backend: db
	cd backend && uv run ruff format --check . && uv run ruff check . && uv run mypy app tests \
		&& OTTO_TEST_DATABASE_URL=$(TEST_DB) uv run pytest

check-mobile:
	cd apps/mobile && npx prettier --check "src/**/*.{ts,tsx}" && npx eslint . && npx tsc --noEmit \
		&& npx jest

check-infra:
	@command -v terraform >/dev/null || { echo "terraform not installed; skipping (CI runs it)"; exit 0; }; \
	cd infra && terraform fmt -check -recursive
