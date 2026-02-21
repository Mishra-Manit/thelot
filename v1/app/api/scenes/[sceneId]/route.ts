import { db } from '@/db'
import { scenes } from '@/db/schema'
import { updateSceneSchema } from '@/lib/validators'
import { apiError, apiSuccess } from '@/lib/utils'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ sceneId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { sceneId } = await params
  const [scene] = await db.select().from(scenes).where(eq(scenes.id, sceneId))
  if (!scene) return apiError('Scene not found', 404)
  return apiSuccess(scene)
}

export async function PUT(req: Request, { params }: Params) {
  const { sceneId } = await params
  const body = await req.json()
  const parsed = updateSceneSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid request body', 400)

  const [scene] = await db
    .update(scenes)
    .set(parsed.data)
    .where(eq(scenes.id, sceneId))
    .returning()
  if (!scene) return apiError('Scene not found', 404)
  return apiSuccess(scene)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { sceneId } = await params
  const [scene] = await db.delete(scenes).where(eq(scenes.id, sceneId)).returning()
  if (!scene) return apiError('Scene not found', 404)
  return apiSuccess({ id: sceneId })
}
