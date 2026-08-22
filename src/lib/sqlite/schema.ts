/**
 * Local SQLite schema — the offline source of truth for synced resources
 * (see docs/architecture/offline-sync.md in the backend repo). Actively
 * read/written by both offline-write systems: the expense-specific outbox
 * (src/lib/sync/expense-outbox.ts, expenses-store.ts) and the generic
 * mutation outbox + resource snapshots (src/lib/sync/mutation-outbox.ts,
 * offline-snapshot.ts, mutation-outbox-store.ts, resource-snapshot-store.ts).
 *
 * Versioned via @capacitor-community/sqlite's own upgrade-statement
 * mechanism (addUpgradeStatement), not a hand-rolled migration runner —
 * bump DB_VERSION and append a new { toVersion, statements } entry for any
 * future schema change; never edit an already-shipped entry in place.
 */
export const DB_NAME = 'laindain'
export const DB_VERSION = 4

export interface SchemaUpgrade {
  toVersion: number
  statements: string[]
}

export const upgradeStatements: SchemaUpgrade[] = [
  {
    toVersion: 1,
    statements: [
      // Mirrors the fields ExpenseDeltaSerializer exposes (see
      // apps/expenses/serializers.py in the backend repo) — amount/date
      // stored as TEXT (ISO strings / decimal-as-string), never a
      // JS/SQLite float, matching this app's existing formatCurrency
      // convention of never doing float arithmetic on money.
      // payers_json/splits_json store the same JSON-encoded-string shape
      // the backend's multipart create endpoints already expect, so an
      // outbox row's payload can be replayed to the API almost verbatim.
      `CREATE TABLE expenses (
        id TEXT PRIMARY KEY,
        context TEXT NOT NULL,
        friendship_id TEXT,
        group_id TEXT,
        added_by_id TEXT NOT NULL,
        description TEXT NOT NULL,
        amount TEXT NOT NULL,
        currency TEXT NOT NULL,
        date TEXT NOT NULL,
        category_id TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        receipt_url TEXT,
        local_receipt_path TEXT,
        split_type TEXT,
        payers_json TEXT NOT NULL,
        splits_json TEXT NOT NULL,
        edited_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'synced'
      )`,
      `CREATE INDEX idx_expenses_scope ON expenses(context, group_id, friendship_id)`,

      // One row per queued offline mutation, drained in created_at order
      // (see offline-sync.md's "apply queued mutations in the order they
      // were created locally"). id doubles as the idempotency key for a
      // create (client-generated UUID = the entity's own id); a later
      // edit/delete of the same not-yet-synced row gets its own outbox
      // row with a fresh idempotency_key, ordered strictly after by
      // created_at.
      `CREATE TABLE expense_outbox (
        id TEXT PRIMARY KEY,
        idempotency_key TEXT NOT NULL,
        method TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        local_receipt_path TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL
      )`,

      // One row per syncable resource — just "expenses" for now. Holds
      // the opaque `next_cursor` apps.sync.pagination.DeltaCursorPagination
      // returns, advanced only after a pulled batch is fully persisted
      // (see offline-sync.md's "advances its stored cursor only after
      // successfully persisting the batch").
      `CREATE TABLE sync_cursors (
        resource TEXT PRIMARY KEY,
        cursor TEXT
      )`,
    ],
  },
  {
    toVersion: 2,
    statements: [
      `ALTER TABLE expenses ADD COLUMN owner_id TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE expenses ADD COLUMN server_json TEXT`,
      `ALTER TABLE expense_outbox ADD COLUMN owner_id TEXT NOT NULL DEFAULT ''`,
      `CREATE INDEX idx_expenses_owner_scope ON expenses(owner_id, context, group_id, friendship_id)`,
      `CREATE INDEX idx_expense_outbox_owner_status ON expense_outbox(owner_id, status, created_at)`,
    ],
  },
  {
    toVersion: 3,
    statements: [
      `CREATE TABLE mutation_outbox (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        resource TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        body_json TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX idx_mutation_outbox_owner_status
        ON mutation_outbox(owner_id, status, created_at)`,
    ],
  },
  {
    toVersion: 4,
    statements: [
      `CREATE TABLE resource_snapshots (
        owner_id TEXT NOT NULL,
        resource TEXT NOT NULL,
        record_id TEXT NOT NULL,
        scope_id TEXT,
        data_json TEXT NOT NULL,
        PRIMARY KEY(owner_id, resource, record_id)
      )`,
      `CREATE INDEX idx_resource_snapshots_scope
        ON resource_snapshots(owner_id, resource, scope_id)`,
    ],
  },
]
