export const EVENT_CONFIG = {
  eventId: 'graduation-2026',
  graduateName: 'Tsedenya Alemu',
  classYear: 'Class of 2026',
  accentColor: '#C9A84C',
  stripPhotoCount: 4,
  galleryUrl: '/gallery',
} as const

export type CaptureMode = 'strip' | 'single'
export type DelaySeconds = 3 | 5 | 10
export type PhotoFilter = 'normal' | 'cinematic' | 'bw' | 'anime'

export const DELAY_OPTIONS: DelaySeconds[] = [3, 5, 10]

export const PHOTO_FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'bw', label: 'Black & White' },
  { id: 'anime', label: 'Anime' },
]
