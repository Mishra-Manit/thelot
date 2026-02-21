import { db } from '@/db'
import { scenes } from '@/db/schema'
import { createSceneSchema } from '@/lib/validators'
import { apiError, apiSuccess } from '@/lib/utils'
import { asc } from 'drizzle-orm'

export async function GET() {
  const allScenes = await db.select().from(scenes).orderBy(asc(scenes.order))
  return apiSuccess(allScenes)
}

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = createSceneSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid request body', 400)

  const [scene] = await db.insert(scenes).values(parsed.data).returning()
  return apiSuccess(scene, 201)
}
