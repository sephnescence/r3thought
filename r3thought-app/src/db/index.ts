import { drizzle } from 'drizzle-orm/node-postgres'

import { databaseUrl } from './url'

export const db = drizzle(databaseUrl)
