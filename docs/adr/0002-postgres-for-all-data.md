# ADR 0002: Postgres for all data, JSONB for the semi-structured parts

- Status: accepted
- Date: 2026-11-20

## Context

The benefits catalog (PRD F4) holds credits that don't share one shape: some need a list of
qualifying merchants, some only count through a travel portal, some need a minimum stay.
That raised the question of a document database such as MongoDB for the catalog, and later
for other uneven data: offers parsed from emails (F7), issuer alert emails, and the AI
assistant's history (F8).

Almost everything in Otto joins back to accounts and transactions. Detecting that a credit
was used means matching a transaction to a credit rule and updating a benefit period in one
step; ranking offers means joining them to what was bought.

## Decision

- **Postgres is the only database.** No MongoDB or other document store.
- Fields that are filtered, sorted or summed (amounts in cents, dates, card and account IDs,
  cadence) are real columns. Details that vary per record go in a **JSONB** column (for
  example a credit's `rules`).
- Data with an uneven source shape (emails, provider payloads) is normalized into rows before
  the rest of the app uses it. Raw originals that are only kept for debugging go to S3.
- Reference data that changes rarely, such as the benefits catalog, lives as a TOML file in
  the repo (read with the standard library's `tomllib`, reviewed through commits, with a
  source and a `last_verified` date per card) and is loaded into Postgres.
- Embeddings for the assistant, when they arrive, use the `pgvector` extension rather than a
  separate vector database.

## Consequences

- One database to run, back up, migrate and connect to from Lambda; matching and updates stay
  in single transactions.
- Changing a JSONB shape needs no migration, but code reading it must handle older shapes.
- Revisit if the catalog grows to thousands of products edited live by non-developers, or if
  a workload appears that needs no joins and very high write volume. Moving only the catalog
  would be a contained change.
