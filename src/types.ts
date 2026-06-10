import type { CaptureMode } from './config/event'

export interface PhotoRecord {
  id: string
  mode: CaptureMode
  blob: Blob
  createdAt: number
  uploaded: boolean
  storagePath?: string
}

export interface PreviewState {
  photoId: string
  mode: CaptureMode
  imageUrl: string
}
