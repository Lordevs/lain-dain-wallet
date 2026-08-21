import { getDatabase } from './init'
import { runInTransaction } from './transaction'

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
  await runInTransaction(async (db) => {
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
  })
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

export async function upsertSnapshotRecord(
  ownerId: string,
  resource: string,
  record: SnapshotRecord,
): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `INSERT INTO resource_snapshots(owner_id, resource, record_id, scope_id, data_json)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(owner_id, resource, record_id) DO UPDATE SET
       scope_id = excluded.scope_id,
       data_json = excluded.data_json`,
    [ownerId, resource, record.id, record.scopeId ?? null, JSON.stringify(record.data)],
  )
}

export async function deleteSnapshotRecord(ownerId: string, resource: string, id: string): Promise<void> {
  const db = await getDatabase()
  await db.run(
    `DELETE FROM resource_snapshots WHERE owner_id = ? AND resource = ? AND record_id = ?`,
    [ownerId, resource, id],
  )
}

export async function transformResourceSnapshot<T>(
  ownerId: string,
  resource: string,
  transform: (records: T[]) => T[],
): Promise<void> {
  const records = await getResourceSnapshot<T>(ownerId, resource)
  const transformed = transform(records)
  await replaceResourceSnapshot(ownerId, resource, transformed.map((data) => ({
    id: (data as { id: string }).id,
    data,
  })))
}

export async function transformSnapshotRecords<T>(
  ownerId: string,
  resource: string,
  transform: (record: SnapshotRecord & { data: T }) => SnapshotRecord & { data: T },
): Promise<void> {
  await runInTransaction(async (db) => {
    const result = await db.query(
      `SELECT record_id, scope_id, data_json FROM resource_snapshots
       WHERE owner_id = ? AND resource = ?`,
      [ownerId, resource],
    )
    for (const row of result.values ?? []) {
      const updated = transform({
        id: row.record_id as string,
        scopeId: row.scope_id as string | null,
        data: JSON.parse(row.data_json as string) as T,
      })
      await db.run(
        `UPDATE resource_snapshots SET scope_id = ?, data_json = ?
         WHERE owner_id = ? AND resource = ? AND record_id = ?`,
        [updated.scopeId ?? null, JSON.stringify(updated.data), ownerId, resource, updated.id],
      )
    }
  })
}
