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
  duration: z.number().int().min(0).optional(),
  action: z.string().optional(),
  internalMonologue: z.string().optional(),
  cameraNotes: z.string().optional(),
})

export const updateShotSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  order: z.number().int().min(0).optional(),
  duration: z.number().int().min(0).optional(),
  action: z.string().optional(),
  internalMonologue: z.string().optional(),
  cameraNotes: z.string().optional(),
})
