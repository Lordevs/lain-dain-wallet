import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import { defineCustomElements as defineJeepSqliteElements } from 'jeep-sqlite/loader'
import { DB_NAME, DB_VERSION, upgradeStatements } from './schema'

const sqlite = new SQLiteConnection(CapacitorSQLite)

// Module-level singleton promise, not re-created per call — createConnection
// throws if called twice for the same database name without closing the
// first, so every caller has to resolve the same in-flight/opened
// connection rather than each racing to open their own.
let dbPromise: Promise<SQLiteDBConnection> | null = null

/** False only when a native shell predates the SQLite plugin. Web uses the
 * jeep-sqlite implementation and current native builds expose the plugin. */
export function isLocalDatabaseAvailable(): boolean {
  return !Capacitor.isNativePlatform() || Capacitor.isPluginAvailable('CapacitorSQLite')
}

/**
 * Web has no native SQLite — @capacitor-community/sqlite backs it with
 * jeep-sqlite, a web component that stores the database in IndexedDB via
 * a bundled sql.js (WASM). None of this bootstrap is needed on iOS/Android,
 * which talk to a real native SQLite directly.
 */
async function ensureWebStore(): Promise<void> {
  if (Capacitor.getPlatform() !== 'web') return

  defineJeepSqliteElements(window)
  if (!document.querySelector('jeep-sqlite')) {
    document.body.appendChild(document.createElement('jeep-sqlite'))
  }
  // jeep-sqlite's default wasmPath ('/assets') expects sql-wasm.wasm
  // served from public/assets/ — see the copy in this project's public/
  // directory (mirrors jeep-sqlite's own build step, which does the same
  // copy for its example apps).
  //
  // That copy MUST come from sql.js@1.11.0 specifically, not whatever's
  // newest — package.json pins sql.js to exactly 1.11.0 for this reason.
  // jeep-sqlite@2.8.0 bundles a frozen, pre-built copy of sql.js's JS
  // glue code (published 2024-08-16, ~2 weeks after sql.js 1.11.0 and
  // ~2.5 months before 1.12.0 shipped — almost certainly what it was
  // built against). That glue code and a wasm binary from a *different*
  // sql.js release are not interchangeable — verified directly: pairing
  // this jeep-sqlite with sql.js@1.14.2's wasm threw `LinkError:
  // WebAssembly.instantiate(): Import #34 "a" "I": function import
  // requires a callable` on every boot. Bumping sql.js here without
  // re-verifying the web platform still boots (see the `run` skill) will
  // silently reintroduce that crash for every web/dev-server user.
  await customElements.whenDefined('jeep-sqlite')
  await sqlite.initWebStore()
}

async function openDatabase(): Promise<SQLiteDBConnection> {
  await ensureWebStore()
  await sqlite.addUpgradeStatement(DB_NAME, upgradeStatements)
  const db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false)
  await db.open()
  return db
}

/** The one local database connection for the whole app — call from
 * anywhere that needs to read/write the offline store; safe to call
 * concurrently, every caller awaits the same underlying connection. */
export function getDatabase(): Promise<SQLiteDBConnection> {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((error) => {
      // A transient native-plugin/startup failure must not poison every
      // later offline action for the lifetime of the WebView.
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}
