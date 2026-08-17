import { Filesystem, Directory } from '@capacitor/filesystem'

/**
 * A receipt picked via the camera/gallery/file picker (see
 * add-receipt-flow.tsx) is a `blob:`/native `webPath` URL — both die
 * across an app restart (confirmed directly: a `blob:` URL is revoked
 * once its originating document/session ends, and a native `webPath` is
 * a Capacitor-internal reference with the same lifetime as the JS
 * context that received it). An offline-queued expense needs its receipt
 * to survive a force-quit while still pending, so it's copied into
 * durable storage the moment it's queued (queueExpenseCreate), not left
 * as a live object URL.
 *
 * @capacitor/filesystem works uniformly on native (real files) and web
 * (its own IndexedDB-backed store) — no separate web-fallback branch
 * needed here, unlike SQLite's jeep-sqlite setup.
 */

const RECEIPT_DIR = Directory.Data

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // reader.result is "data:<mime>;base64,<data>" — Filesystem.writeFile
      // wants just the base64 payload when no `encoding` is given (binary mode).
      const result = reader.result as string
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string): Promise<Blob> {
  return fetch(`data:application/octet-stream;base64,${base64}`).then((res) => res.blob())
}

/** Copies a picker-supplied receipt URL into durable storage, returning
 * the path to pass as `local_receipt_path`. */
export async function stageReceiptForOffline(sourceUri: string, expenseId: string): Promise<string> {
  const blob = await fetch(sourceUri).then((res) => res.blob())
  const base64 = await blobToBase64(blob)
  const path = `receipts/${expenseId}.jpg`
  await Filesystem.writeFile({ path, data: base64, directory: RECEIPT_DIR, recursive: true })
  return path
}

/** Rebuilds a real Blob from a path staged by stageReceiptForOffline —
 * used at actual submit time (queueExpenseCreate's immediate-online path,
 * or a later drain), never at queue time. */
export async function readStagedReceipt(path: string): Promise<Blob> {
  const { data } = await Filesystem.readFile({ path, directory: RECEIPT_DIR })
  // data is a base64 string on both native and web for a path written
  // without `encoding` above (binary mode) — the Blob-typed union member
  // only applies to web reads made with certain other option shapes.
  return base64ToBlob(data as string)
}

/** Called once a queued expense has actually synced — the server now
 * has the receipt, so the local copy is just wasted storage. Best-effort:
 * a leftover file after a failed delete costs nothing but disk space. */
export async function deleteStagedReceipt(path: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path, directory: RECEIPT_DIR })
  } catch {
    // best-effort cleanup, see above
  }
}
