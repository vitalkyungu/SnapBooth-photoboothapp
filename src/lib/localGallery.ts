import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { PhotoRecord } from '../types'

interface PhotoboothDB extends DBSchema {
  photos: {
    key: string
    value: PhotoRecord
    indexes: { 'by-created': number; 'by-uploaded': number }
  }
}

const DB_NAME = 'photobooth-gallery'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PhotoboothDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PhotoboothDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('photos', { keyPath: 'id' })
        store.createIndex('by-created', 'createdAt')
        store.createIndex('by-uploaded', 'uploaded')
      },
    })
  }
  return dbPromise
}

export async function savePhoto(record: PhotoRecord): Promise<void> {
  const db = await getDb()
  await db.put('photos', record)
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await getDb()
  return db.get('photos', id)
}

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  const db = await getDb()
  const photos = await db.getAllFromIndex('photos', 'by-created')
  return photos.reverse()
}

export async function getPendingUploads(): Promise<PhotoRecord[]> {
  const db = await getDb()
  const all = await db.getAll('photos')
  return all.filter((photo) => !photo.uploaded)
}

export async function markPhotoUploaded(id: string, storagePath: string): Promise<void> {
  const db = await getDb()
  const photo = await db.get('photos', id)
  if (!photo) return
  await db.put('photos', { ...photo, uploaded: true, storagePath })
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
