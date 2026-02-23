import { createId } from '@paralleldrive/cuid2'
import { boolean, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

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
  framesStatus: varchar('frames_status', { length: 32 }).notNull().default('idle'),
  videoStatus: varchar('video_status', { length: 32 }).notNull().default('idle'),
  voiceStatus: varchar('voice_status', { length: 32 }).notNull().default('idle'),
  lipsyncStatus: varchar('lipsync_status', { length: 32 }).notNull().default('idle'),
  approved: boolean('approved').notNull().default(false),
  action: text('action'),
  internalMonologue: text('internal_monologue'),
  cameraNotes: text('camera_notes'),
  soundCues: text('sound_cues'),
  videoClipTitle: varchar('video_clip_title', { length: 255 }),
  videoUrl: varchar('video_url', { length: 2048 }),
  startFramePrompt: text('start_frame_prompt'),
  endFramePrompt: text('end_frame_prompt'),
  videoPrompt: text('video_prompt'),
  startFrameUrl: varchar('start_frame_url', { length: 2048 }),
  voiceUrl: varchar('voice_url', { length: 2048 }),
  lipsyncVideoUrl: varchar('lipsync_video_url', { length: 2048 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Scene = typeof scenes.$inferSelect
export type Shot = typeof shots.$inferSelect
export type NewScene = typeof scenes.$inferInsert
export type NewShot = typeof shots.$inferInsert
