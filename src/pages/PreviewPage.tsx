import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPhoto } from '../lib/localGallery'
import { isCloudConfigured, uploadPhoto } from '../lib/cloudUpload'
import {
  buildPhotoFilename,
  canShareFiles,
  downloadPhoto,
  sharePhoto,
} from '../lib/share'
import type { PreviewState } from '../types'

export function PreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const previewState = location.state as PreviewState | null

  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'offline'>(
    'local',
  )
  const [shareError, setShareError] = useState<string | null>(null)

  useEffect(() => {
    if (!previewState?.photoId) {
      navigate('/', { replace: true })
    }
  }, [navigate, previewState])

  useEffect(() => {
    if (!previewState?.photoId) return

    let cancelled = false

    const syncPhoto = async () => {
      if (!isCloudConfigured()) {
        setSyncStatus('offline')
        return
      }

      if (!navigator.onLine) {
        setSyncStatus('offline')
        return
      }

      setSyncStatus('syncing')
      const record = await getPhoto(previewState.photoId)
      if (!record || cancelled) return

      if (record.uploaded) {
        setSyncStatus('synced')
        return
      }

      const path = await uploadPhoto(record)
      if (cancelled) return
      setSyncStatus(path ? 'synced' : 'local')
    }

    void syncPhoto()

    return () => {
      cancelled = true
      if (previewState.imageUrl) {
        URL.revokeObjectURL(previewState.imageUrl)
      }
    }
  }, [previewState])

  if (!previewState?.imageUrl) {
    return null
  }

  const filename = buildPhotoFilename(previewState.mode)

  const handleShare = async () => {
    setShareError(null)
    const record = await getPhoto(previewState.photoId)
    const blob = record?.blob

    if (!blob) {
      setShareError('Photo not found in local gallery.')
      return
    }

    try {
      const shared = await sharePhoto(blob, filename)
      if (!shared) {
        downloadPhoto(blob, filename)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Share failed.'
      setShareError(message)
    }
  }

  const handleDownload = async () => {
    const record = await getPhoto(previewState.photoId)
    if (record?.blob) {
      downloadPhoto(record.blob, filename)
    }
  }

  const handleRetake = () => {
    navigate('/')
  }

  const syncLabel =
    syncStatus === 'synced'
      ? 'Synced to cloud gallery'
      : syncStatus === 'syncing'
        ? 'Uploading to cloud…'
        : syncStatus === 'offline'
          ? 'Saved locally · cloud sync when online'
          : 'Saved locally'

  return (
    <main className="page preview-page">
      <header className="page-header compact">
        <h1>Your photo</h1>
        <p className="subtitle">{syncLabel}</p>
      </header>

      <div className="preview-frame">
        <img src={previewState.imageUrl} alt="Captured photobooth result" />
      </div>

      <section className="preview-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => void handleShare()}>
          {canShareFiles() ? 'Share' : 'Save photo'}
        </button>
        <button type="button" className="btn btn-outline btn-lg" onClick={handleDownload}>
          Download
        </button>
        <button type="button" className="btn btn-ghost btn-lg" onClick={handleRetake}>
          Take another
        </button>
      </section>

      {shareError ? <p className="status-message error">{shareError}</p> : null}

      <p className="preview-hint">
        Saved to this iPad&apos;s local gallery — find it anytime under Local gallery on the home screen.
        {canShareFiles() ? ' Share opens AirDrop, Messages, and more.' : ''}
      </p>
    </main>
  )
}
