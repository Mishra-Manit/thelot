"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { updateShotById } from "@/lib/storyboard-repo"
import { updateShotSchema } from "@/lib/validators"

const updateShotActionSchema = updateShotSchema.extend({
  shotId: z.string().min(1),
})

export async function updateShotAction(input: unknown) {
  const parsed = updateShotActionSchema.safeParse(input)
  if (!parsed.success) {
    const flattened = parsed.error.flatten()
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        formErrors: flattened.formErrors,
        fieldErrors: flattened.fieldErrors,
      },
    }
  }

  const { shotId, ...patch } = parsed.data

  try {
    await updateShotById(shotId, patch)
    revalidatePath("/")
    return { ok: true as const }
  } catch (error) {
    return {
      ok: false as const,
      error: {
        code: "INTERNAL_ERROR" as const,
        message: error instanceof Error ? error.message : "Failed to update shot",
      },
    }
  }
}
