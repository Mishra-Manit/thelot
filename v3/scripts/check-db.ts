import { db } from '../db/index'
import { sql } from 'drizzle-orm'

async function check() {
  const result = await db.execute(sql`SELECT * FROM drizzle.__drizzle_migrations`)
  console.log(result.rows)
  process.exit(0)
}
check().catch(console.error)
