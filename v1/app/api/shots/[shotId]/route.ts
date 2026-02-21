import { db } from '@/db'
import { shots } from '@/db/schema'
import { updateShotSchema } from '@/lib/validators'
import { apiError, apiSuccess } from '@/lib/utils'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ shotId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { shotId } = await params
  const [shot] = await db.select().from(shots).where(eq(shots.id, shotId))
  if (!shot) return apiError('Shot not found', 404)
  return apiSuccess(shot)
}

export async function PUT(req: Request, { params }: Params) {
  const { shotId } = await params
  const body = await req.json()
  const parsed = updateShotSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid request body', 400)

  const [shot] = await db
    .update(shots)
    .set(parsed.data)
    .where(eq(shots.id, shotId))
    .returning()
  if (!shot) return apiError('Shot not found', 404)
  return apiSuccess(shot)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { shotId } = await params
  const [shot] = await db.delete(shots).where(eq(shots.id, shotId)).returning()
  if (!shot) return apiError('Shot not found', 404)
  return apiSuccess({ id: shotId })
}
