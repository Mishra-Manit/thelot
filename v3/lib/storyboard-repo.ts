import { asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { scenes, shots } from "@/db/schema"
import type { StoryboardScene, StoryboardShotUpdateInput } from "@/lib/storyboard-types"

export async function listStoryboard(): Promise<StoryboardScene[]> {
  const sceneRows = await db.select().from(scenes).orderBy(asc(scenes.order))
  const shotRows = await db.select().from(shots).orderBy(asc(shots.order))

  const shotsByScene = new Map<string, typeof shotRows>()
  for (const shot of shotRows) {
    const bucket = shotsByScene.get(shot.sceneId) ?? []
    bucket.push(shot)
    shotsByScene.set(shot.sceneId, bucket)
  }

  return sceneRows.map((scene) => ({
    id: scene.id,
    number: scene.order,
    title: scene.title,
    shots: (shotsByScene.get(scene.id) ?? []).map((shot) => ({
      id: shot.id,
      number: shot.order,
      title: shot.title,
      duration: shot.duration ?? 0,
      action: shot.action ?? "",
      internalMonologue: shot.internalMonologue ?? "",
      cameraNotes: shot.cameraNotes ?? "",
      soundCues: shot.soundCues ?? "",
      videoClipTitle: shot.videoClipTitle ?? "",
      videoUrl: shot.videoUrl ?? "",
      startFramePrompt: shot.startFramePrompt ?? "",
      endFramePrompt: shot.endFramePrompt ?? "",
      videoPrompt: shot.videoPrompt ?? "",
      startFrameUrl: shot.startFrameUrl ?? "",
      voiceUrl: shot.voiceUrl ?? "",
      lipsyncVideoUrl: shot.lipsyncVideoUrl ?? "",
    })),
  }))
}

export async function updateShotById(shotId: string, patch: StoryboardShotUpdateInput) {
  await db.update(shots).set(patch).where(eq(shots.id, shotId))
}
