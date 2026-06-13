import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { PhotoRecord } from '../types'

interface StoredPhotoRecord {
  id: string
  mode: PhotoRecord['mode']
  data: ArrayBuffer
  mimeType: string
  createdAt: number
  uploaded: boolean
  storagePath?: string
}

/** Legacy records saved before ArrayBuffer storage (unreliable on Safari). */
interface LegacyPhotoRecord {
  id: string
  mode: PhotoRecord['mode']
  blob?: Blob
  createdAt: number
  uploaded: boolean
  storagePath?: string
}

interface PhotoboothDB extends DBSchema {
  photos: {
    key: string
    value: StoredPhotoRecord | LegacyPhotoRecord
    indexes: { 'by-created': number; 'by-uploaded': number }
  }
}

const DB_NAME = 'photobooth-gallery'
const DB_VERSION = 2
const DEFAULT_MIME = 'image/jpeg'

let dbPromise: Promise<IDBPDatabase<PhotoboothDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PhotoboothDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('photos')) {
          const store = db.createObjectStore('photos', { keyPath: 'id' })
          store.createIndex('by-created', 'createdAt')
          store.createIndex('by-uploaded', 'uploaded')
        }
      },
    })
  }
  return dbPromise
}

function toPhotoRecord(raw: StoredPhotoRecord | LegacyPhotoRecord): PhotoRecord | null {
  if ('data' in raw && raw.data.byteLength > 0) {
    return {
      id: raw.id,
      mode: raw.mode,
      blob: new Blob([raw.data], { type: raw.mimeType || DEFAULT_MIME }),
      createdAt: raw.createdAt,
      uploaded: raw.uploaded,
      storagePath: raw.storagePath,
    }
  }

  if ('blob' in raw && raw.blob instanceof Blob && raw.blob.size > 0) {
    return {
      id: raw.id,
      mode: raw.mode,
      blob: raw.blob,
      createdAt: raw.createdAt,
      uploaded: raw.uploaded,
      storagePath: raw.storagePath,
    }
  }

  return null
}

async function toStoredRecord(record: PhotoRecord): Promise<StoredPhotoRecord> {
  const data = await record.blob.arrayBuffer()
  return {
    id: record.id,
    mode: record.mode,
    data,
    mimeType: record.blob.type || DEFAULT_MIME,
    createdAt: record.createdAt,
    uploaded: record.uploaded,
    storagePath: record.storagePath,
  }
}

export async function savePhoto(record: PhotoRecord): Promise<void> {
  if (!record.blob || record.blob.size === 0) {
    throw new Error('Photo data is empty and could not be saved.')
  }

  const db = await getDb()
  const stored = await toStoredRecord(record)
  await db.put('photos', stored)

  const saved = await db.get('photos', record.id)
  if (!saved) {
    throw new Error('Photo failed to save to local gallery.')
  }

  const restored = toPhotoRecord(saved)
  if (!restored || restored.blob.size === 0) {
    throw new Error('Photo failed to save to local gallery.')
  }
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await getDb()
  const raw = await db.get('photos', id)
  if (!raw) return undefined
  return toPhotoRecord(raw) ?? undefined
}

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  const db = await getDb()
  const rows = await db.getAllFromIndex('photos', 'by-created')
  const photos: PhotoRecord[] = []

  for (const row of rows) {
    const record = toPhotoRecord(row)
    if (record) {
      photos.push(record)
    }
  }

  return photos.reverse()
}

export async function getPendingUploads(): Promise<PhotoRecord[]> {
  const db = await getDb()
  const all = await db.getAll('photos')
  const pending: PhotoRecord[] = []

  for (const row of all) {
    const record = toPhotoRecord(row)
    if (record && !record.uploaded) {
      pending.push(record)
    }
  }

  return pending
}

export async function markPhotoUploaded(id: string, storagePath: string): Promise<void> {
  const db = await getDb()
  const raw = await db.get('photos', id)
  if (!raw) return

  const record = toPhotoRecord(raw)
  if (!record) return

  await savePhoto({ ...record, uploaded: true, storagePath })
}

export async function createPhotoRecord(
  mode: PhotoRecord['mode'],
  blob: Blob,
): Promise<PhotoRecord> {
  return {
    id: crypto.randomUUID(),
    mode,
    blob,
    createdAt: Date.now(),
    uploaded: false,
  }
}
