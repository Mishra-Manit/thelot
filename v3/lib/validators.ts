import { z } from 'zod'

export const createSceneSchema = z.object({
  title: z.string().min(1).max(255),
  order: z.number().int().min(0),
})

export const updateSceneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  order: z.number().int().min(0).optional(),
})

export const createShotSchema = z.object({
  title: z.string().min(1).max(255),
  order: z.number().int().min(0),
  duration: z.number().int().min(1).max(30).optional(),
  action: z.string().optional(),
  internalMonologue: z.string().optional(),
  cameraNotes: z.string().optional(),
  soundCues: z.string().optional(),
  videoClipTitle: z.string().max(255).optional(),
  videoUrl: z.string().max(2048).optional(),
  startFramePrompt: z.string().optional(),
  endFramePrompt: z.string().optional(),
  videoPrompt: z.string().optional(),
})

export const updateShotSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  order: z.number().int().min(0).optional(),
  duration: z.number().int().min(1).max(30).optional(),
  framesStatus: z.enum(["idle", "loading", "ready"]).optional(),
  videoStatus: z.enum(["idle", "loading", "ready"]).optional(),
  voiceStatus: z.enum(["idle", "loading", "ready"]).optional(),
  lipsyncStatus: z.enum(["idle", "loading", "ready"]).optional(),
  approved: z.boolean().optional(),
  action: z.string().optional(),
  internalMonologue: z.string().optional(),
  cameraNotes: z.string().optional(),
  soundCues: z.string().optional(),
  videoClipTitle: z.string().max(255).optional(),
  videoUrl: z.string().max(2048).optional(),
  startFramePrompt: z.string().optional(),
  endFramePrompt: z.string().optional(),
  videoPrompt: z.string().optional(),
})
