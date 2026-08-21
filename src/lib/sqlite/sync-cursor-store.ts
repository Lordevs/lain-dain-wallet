import { getDatabase } from './init'

export async function getSyncCursor(resource: string): Promise<string | null> {
  const db = await getDatabase()
  const result = await db.query(`SELECT cursor FROM sync_cursors WHERE resource = ?`, [resource])
  return (result.values?.[0]?.cursor as string | null | undefined) ?? null
}

export async function setSyncCursor(resource: string, cursor: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `INSERT INTO sync_cursors(resource, cursor) VALUES (?, ?)
     ON CONFLICT(resource) DO UPDATE SET cursor = excluded.cursor`,
    [resource, cursor],
  )
}
