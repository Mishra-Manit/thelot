import { pgTable, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const scenes = pgTable('scenes', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  title: varchar('title', { length: 255 }).notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const shots = pgTable('shots', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  sceneId: varchar('scene_id', { length: 128 })
    .notNull()
    .references(() => scenes.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  order: integer('order').notNull().default(0),
  duration: integer('duration'),
  action: text('action'),
  internalMonologue: text('internal_monologue'),
  cameraNotes: text('camera_notes'),
  videoUrl: varchar('video_url', { length: 2048 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Scene = typeof scenes.$inferSelect
export type Shot = typeof shots.$inferSelect
export type NewScene = typeof scenes.$inferInsert
export type NewShot = typeof shots.$inferInsert
