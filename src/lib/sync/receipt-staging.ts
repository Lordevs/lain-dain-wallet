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

function base64ToBlob(base64: string, mimeType = 'application/octet-stream'): Promise<Blob> {
  return fetch(`data:${mimeType};base64,${base64}`).then((res) => res.blob())
}

export interface StagedFile {
  path: string
  filename: string
  mimeType: string
}

function safeExtension(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]{1,8})$/)
  return match ? `.${match[1].toLowerCase()}` : ''
}

/** Persist a picker URL for any queued multipart mutation. Only metadata is
 * stored in SQLite; the binary stays in Capacitor's durable file store. */
export async function stageFileForOffline(
  sourceUri: string,
  mutationId: string,
  filename = 'attachment',
  mimeType?: string,
): Promise<StagedFile> {
  const blob = await fetch(sourceUri).then((res) => res.blob())
  const resolvedMimeType = mimeType || blob.type || 'application/octet-stream'
  const extension = safeExtension(filename)
  const path = `mutation-attachments/${mutationId}${extension}`
  await Filesystem.writeFile({
    path,
    data: await blobToBase64(blob),
    directory: RECEIPT_DIR,
    recursive: true,
  })
  return { path, filename, mimeType: resolvedMimeType }
}

export async function readStagedFile(file: StagedFile): Promise<Blob> {
  const { data } = await Filesystem.readFile({ path: file.path, directory: RECEIPT_DIR })
  return base64ToBlob(data as string, file.mimeType)
}

export async function deleteStagedFile(path: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path, directory: RECEIPT_DIR })
  } catch {
    // Best-effort cleanup. The mutation has already reached the server.
  }
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
