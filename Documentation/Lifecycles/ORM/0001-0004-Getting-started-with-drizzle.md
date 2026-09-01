# Drizzle / Postgres - Bare Minimum

Next: [Dockerised Postgres for local testing](0002-0005-Dockerised-Postgres-for-local-testing.md)

The bar for bare minimum is bare minimum is admittedly high...

Integration tests are to be executed against a Docker container running an image that reflects the production database. The database version in testing is flexible, but should be created as an entirely new docker file so that we can detect issues in code before a real upgrade is made

I prefer using Postgres databases, even locally within docker to test any and all migrations against. A CI step will run the migration step and diff the test database to assert there are no uncommitted changes

Where a fair bare minimum comes into play, start with a single model and a single field. Subsequent steps will involve tracking createdAt, updatedAt, deletedAt, and include versioning history so that users can walk through the history of a model in an admin section that isn't going to be created here, but is important to note, because it forms part of what I'd expect in a data model. My history is with Laravel and Eloquent. To my understanding, Drizzle is the closest Node package in terms of feature parity, but I expect that I'll have to add in custom code to facilitate how we'd specify each and every column's configuration to drive the admin pages, as well as defining what type of control to show when admin creating a page / admin editing a page (with no pressure to mirror the user facing UI in terms of administering the data in the database). Touching on permissions a bit, I don't want to hand roll OAuth, so I will prefer an integration with Clerk, which also supports having custom data stored on their side to denote a user is an administrator

Additionally, it is expected that development will never happen against a production database, so the Model equivalent that is implemented here will specify how data is sanitised. I am a firm believer in allowing the _shape_ of a database to be known to an extent, as SaaS platforms generally vary greatly in how tenants actually use their schema... In the past I've operated Postgres databases as separate schemas entirely per tenant, so that they can have a backup executed and sanitised for use within a lower environment to diagnose issues without having any PII contained within the data

As such, while probably for the "NextJS Github Repository" Stages, merging to main will deploy to the development environment, executing migrations as well. However since the project will start out small, it will be of great value to perform a backup of the database at the time of release, so a rollback can be performed if necessary. Another Github Workflow to deploy could be used, but the intention is to host on Vercel, which can take care of automatic deployment. I'm not sure if it can handle migrations, but that can be determined in due time. Similarly, I expect that I can hook up Vercel against a different trunk than main. If not, I'll have to update the repository so that a different branch is the default branch, and that releases are pull requests against main

## What was executed

Drizzle installed into `r3thought-app`, with one model (`TestingModel`) holding one column (`test_name`) in a dedicated Postgres schema called `testing`, and a committed SQL migration generated from it. Applying that migration needs a database to exist first - standing one up in Docker, applying the migration, and committing a diffable dump of the resulting schema is the [next Stage](0002-0005-Dockerised-Postgres-for-local-testing.md)

### Install Drizzle

```bash
cd r3thought-app
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg
```

`pg` (node-postgres) is the driver used both locally against Docker and by `drizzle-kit migrate`. When production lands on Neon this can be revisited (Neon offers a serverless driver), but the schema and migrations are driver-agnostic

### Define the model

`src/db/schema.ts`:

```ts
import { pgSchema, text } from 'drizzle-orm/pg-core'

export const testing = pgSchema('testing')

export const testingModel = testing.table('testing_model', {
  testName: text('test_name'),
})

export type TestingModel = typeof testingModel.$inferSelect
```

`pgSchema('testing')` is what puts the table in a named Postgres schema rather than `public` - this is the building block for the schema-per-tenant approach described above

`src/db/index.ts` exposes the client the app will query through:

```ts
import { drizzle } from 'drizzle-orm/node-postgres'

export const db = drizzle(
  process.env.DATABASE_URL ??
    'postgres://r3thought:r3thought@localhost:5432/r3thought',
)
```

The fallback connection string matches the Docker container from the next Stage, so a fresh clone works with zero env configuration. `DATABASE_URL` overrides it in deployed environments

### Configure drizzle-kit

`drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://r3thought:r3thought@localhost:5432/r3thought',
  },
})
```

### Generate the migration

```bash
pnpm db:generate # drizzle-kit generate
```

This wrote `drizzle/0000_abnormal_nebula.sql` (drizzle-kit names migrations itself), which is committed alongside the schema:

```sql
CREATE SCHEMA "testing";
--> statement-breakpoint
CREATE TABLE "testing"."testing_model" (
	"test_name" text
);
```

Deliberately no primary key, no timestamps, no versioning history yet - a single model with a single field is the bare minimum, and the later tiers described above will layer `createdAt` / `updatedAt` / `deletedAt` and history on top
