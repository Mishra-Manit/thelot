import { db } from '@/db'
import { shots } from '@/db/schema'
import { createShotSchema } from '@/lib/validators'
import { apiError, apiSuccess } from '@/lib/utils'
import { eq, asc } from 'drizzle-orm'

type Params = { params: Promise<{ sceneId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { sceneId } = await params
  const sceneShots = await db
    .select()
    .from(shots)
    .where(eq(shots.sceneId, sceneId))
    .orderBy(asc(shots.order))
  return apiSuccess(sceneShots)
}

export async function POST(req: Request, { params }: Params) {
  const { sceneId } = await params
  const body = await req.json()
  const parsed = createShotSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid request body', 400)

  const [shot] = await db
    .insert(shots)
    .values({ ...parsed.data, sceneId })
    .returning()
  return apiSuccess(shot, 201)
}
