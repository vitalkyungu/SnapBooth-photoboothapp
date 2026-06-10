import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { EVENT_CONFIG } from '../config/event'
import { getPendingUploads, markPhotoUploaded } from './localGallery'
import type { PhotoRecord } from '../types'

export interface CloudPhoto {
  id: string
  event_id: string
  storage_path: string
  mode: 'strip' | 'single'
  created_at: string
  public_url: string
}

let supabaseClient: SupabaseClient | null = null

function getSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey)
  }

  return supabaseClient
}

export function isCloudConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export async function uploadPhoto(record: PhotoRecord): Promise<string | null> {
  const supabase = getSupabase()
  if (!supabase || !navigator.onLine) {
    return null
  }

  const storagePath = `${EVENT_CONFIG.eventId}/${record.createdAt}-${record.mode}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('photobooth')
    .upload(storagePath, record.blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload failed:', uploadError.message)
    return null
  }

  const { error: insertError } = await supabase.from('photos').insert({
    id: record.id,
    event_id: EVENT_CONFIG.eventId,
    storage_path: storagePath,
    mode: record.mode,
    created_at: new Date(record.createdAt).toISOString(),
  })

  if (insertError) {
    console.error('Database insert failed:', insertError.message)
    return null
  }

  await markPhotoUploaded(record.id, storagePath)
  return storagePath
}

export async function retryPendingUploads(): Promise<number> {
  if (!isCloudConfigured() || !navigator.onLine) {
    return 0
  }

  const pending = await getPendingUploads()
  let uploadedCount = 0

  for (const photo of pending) {
    const path = await uploadPhoto(photo)
    if (path) {
      uploadedCount += 1
    }
  }

  return uploadedCount
}

export async function fetchCloudGallery(): Promise<CloudPhoto[]> {
  const supabase = getSupabase()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('photos')
    .select('id, event_id, storage_path, mode, created_at')
    .eq('event_id', EVENT_CONFIG.eventId)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Gallery fetch failed:', error?.message)
    return []
  }

  return data.map((row) => {
    const { data: urlData } = supabase.storage.from('photobooth').getPublicUrl(row.storage_path)
    return {
      ...row,
      public_url: urlData.publicUrl,
    }
  })
}

export function startUploadRetryListener(onSynced?: () => void): () => void {
  const handler = () => {
    void retryPendingUploads().then((count) => {
      if (count > 0) {
        onSynced?.()
      }
    })
  }

  window.addEventListener('online', handler)
  void retryPendingUploads()

  return () => {
    window.removeEventListener('online', handler)
  }
}
