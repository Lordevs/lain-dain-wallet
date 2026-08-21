import { getDatabase } from './init'

export interface SnapshotRecord {
  id: string
  scopeId?: string | null
  data: unknown
}

export async function replaceResourceSnapshot(
  ownerId: string,
  resource: string,
  records: SnapshotRecord[],
): Promise<void> {
  const db = await getDatabase()
  await db.beginTransaction()
  try {
    await db.run(
      `DELETE FROM resource_snapshots WHERE owner_id = ? AND resource = ?`,
      [ownerId, resource],
    )
    for (const record of records) {
      await db.run(
        `INSERT INTO resource_snapshots(owner_id, resource, record_id, scope_id, data_json)
         VALUES (?, ?, ?, ?, ?)`,
        [ownerId, resource, record.id, record.scopeId ?? null, JSON.stringify(record.data)],
      )
    }
    await db.commitTransaction()
  } catch (error) {
    await db.rollbackTransaction()
    throw error
  }
}

export async function getResourceSnapshot<T>(
  ownerId: string,
  resource: string,
  scopeId?: string,
): Promise<T[]> {
  const db = await getDatabase()
  const result = scopeId === undefined
    ? await db.query(
        `SELECT data_json FROM resource_snapshots WHERE owner_id = ? AND resource = ?`,
        [ownerId, resource],
      )
    : await db.query(
        `SELECT data_json FROM resource_snapshots
         WHERE owner_id = ? AND resource = ? AND scope_id = ?`,
        [ownerId, resource, scopeId],
      )
  return (result.values ?? []).map((row) => JSON.parse(row.data_json as string) as T)
}

export async function getSnapshotRecord<T>(ownerId: string, resource: string, id: string): Promise<T | null> {
  const db = await getDatabase()
  const result = await db.query(
    `SELECT data_json FROM resource_snapshots
     WHERE owner_id = ? AND resource = ? AND record_id = ?`,
    [ownerId, resource, id],
  )
  const json = result.values?.[0]?.data_json as string | undefined
  return json ? JSON.parse(json) as T : null
}
