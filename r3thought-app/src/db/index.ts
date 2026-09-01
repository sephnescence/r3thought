import { drizzle } from 'drizzle-orm/node-postgres'

export const db = drizzle(
  process.env.DATABASE_URL ??
    'postgres://r3thought:r3thought@localhost:5432/r3thought',
)
