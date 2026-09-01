import { pgSchema, text } from 'drizzle-orm/pg-core'

export const testing = pgSchema('testing')

export const testingModel = testing.table('testing_model', {
  testName: text('test_name'),
})

export type TestingModel = typeof testingModel.$inferSelect
