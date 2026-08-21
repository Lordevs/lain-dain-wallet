import type { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { getDatabase } from './init'

// Capacitor exposes one shared SQLite connection, and that connection only
// permits one active transaction. Snapshot refreshes and user mutations can
// arrive concurrently, so serialize transaction boundaries process-wide.
let transactionQueue: Promise<void> = Promise.resolve()

export function runInTransaction<T>(
  operation: (db: SQLiteDBConnection) => Promise<T>,
): Promise<T> {
  const run = transactionQueue.then(async () => {
    const db = await getDatabase()
    await db.beginTransaction()
    try {
      const result = await operation(db)
      await db.commitTransaction()
      return result
    } catch (error) {
      await db.rollbackTransaction()
      throw error
    }
  })

  // A failed operation must not prevent later transactions from running.
  transactionQueue = run.then(() => undefined, () => undefined)
  return run
}
