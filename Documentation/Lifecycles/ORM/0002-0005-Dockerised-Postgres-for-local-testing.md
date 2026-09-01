# Dockerised Postgres for Local Testing - Bare Minimum

Previous: [Getting started with Drizzle](0001-0004-Getting-started-with-drizzle.md)

## What this Stage gets you

A Postgres 17 container for local development and integration testing, the `TestingModel` migration from the previous Stage applied to it, and a deterministic `pg_dump` of the resulting schema committed to the repo. The committed dump is the artefact that lets a CI step later run the migrations against a throwaway container, re-dump, and `git diff --exit-code` to assert the committed schema matches what the migrations actually produce

Development never happens against a production database - this container _is_ the database as far as a local checkout is concerned

## The container

`r3thought-app/docker/postgres-17/compose.yaml`:

```yaml
name: r3thought-postgres-17

services:
  postgres:
    image: postgres:17.11
    environment:
      POSTGRES_USER: r3thought
      POSTGRES_PASSWORD: r3thought
      POSTGRES_DB: r3thought
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready --username r3thought --dbname r3thought']
      interval: 2s
      timeout: 5s
      retries: 15

volumes:
  postgres-data:
```

Decisions baked into that file:

- **The version lives in the directory name.** Upgrading Postgres means creating a new `docker/postgres-18/` directory beside this one and pointing the scripts at it, never editing this file in place - so upgrade problems surface as a reviewable diff (new compose file + regenerated dump) before any real database is touched
- **The image is pinned to an exact version (`17.11`), not `17`.** `pg_dump` writes the server version into the dump's header comments, so a floating tag would make the committed dump differ between machines that pulled the image at different times, and the CI diff assertion would rot. Production is intended for Neon, which runs Postgres 17, hence 17 here
- **The healthcheck** is what makes `docker compose up --wait` block until the database is actually accepting connections, so the migrate step can be chained straight after it
- **Credentials are throwaway** (`r3thought`/`r3thought`) and only ever bind to localhost. They intentionally match the fallback connection string in `drizzle.config.ts` and `src/db/index.ts`, so a fresh clone needs no env setup

## The scripts

Added to `r3thought-app/package.json`:

```json
"db:up": "docker compose -f docker/postgres-17/compose.yaml up --detach --wait",
"db:down": "docker compose -f docker/postgres-17/compose.yaml down",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:dump": "docker compose -f docker/postgres-17/compose.yaml exec postgres pg_dump --username r3thought --schema-only --no-owner --no-privileges --restrict-key=r3thought r3thought > docker/postgres-17/dump/schema.sql"
```

The full loop after changing `src/db/schema.ts`:

```bash
pnpm db:up       # start (or reuse) the container, wait for healthy
pnpm db:generate # write a new SQL migration into drizzle/
pnpm db:migrate  # apply pending migrations to the container
pnpm db:dump     # refresh the committed schema dump
```

All four artefacts get committed together: the schema change, the generated migration, and the refreshed dump

## The committed dump

`r3thought-app/docker/postgres-17/dump/schema.sql` is the dump of the testing database with `testing.testing_model` in it:

```sql
CREATE SCHEMA testing;

CREATE TABLE testing.testing_model (
    test_name text
);
```

(abridged - the committed file is the full `pg_dump` output, including the `drizzle.__drizzle_migrations` bookkeeping table that `drizzle-kit migrate` maintains)

Every flag on the `db:dump` script exists to keep the output byte-for-byte reproducible, because a dump you can't reproduce can't be diffed in CI:

- `--schema-only` - structure, not data. Row contents (like migration timestamps in `drizzle.__drizzle_migrations`) would differ per machine
- `--no-owner --no-privileges` - strips role names, which would otherwise couple the dump to whoever ran it
- `--restrict-key=r3thought` - newer `pg_dump` releases wrap dumps in `\restrict <token>` guards with a _random_ token per run; pinning the key makes it stable

The dump is a diffable snapshot, not an init script - a fresh database is always built by running the migrations, never by loading the dump. If it were loaded, `drizzle-kit migrate` would see the schema already present but no migration journal rows, and fall over

## What this Stage deliberately leaves out

- **The CI job** that runs `db:up`, `db:migrate`, `db:dump` and fails on a dirty `git diff` - the pieces are all here, wiring it into `.github/workflows/ci.yml` is a follow-up Stage
- **Seed/sanitised data** - the previous Stage's notes on sanitisation apply to data dumps from real environments, which don't exist yet
- **A second container per Postgres version** - the pattern is established by the directory layout, the second directory arrives when an upgrade is actually being tested
