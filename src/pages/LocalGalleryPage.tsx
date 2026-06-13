import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPhotos } from '../lib/localGallery'
import {
  buildPhotoFilename,
  canShareFiles,
  downloadPhoto,
  sharePhoto,
} from '../lib/share'
import type { PhotoRecord } from '../types'

export function LocalGalleryPage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map())
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const reloadPhotos = useCallback(() => {
    void getAllPhotos().then(setPhotos)
  }, [])

  useEffect(() => {
    reloadPhotos()
  }, [reloadPhotos])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        reloadPhotos()
      }
    }

    window.addEventListener('focus', reloadPhotos)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.removeEventListener('focus', reloadPhotos)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [reloadPhotos])

  useEffect(() => {
    const urls = new Map<string, string>()
    for (const photo of photos) {
      urls.set(photo.id, URL.createObjectURL(photo.blob))
    }
    setThumbnailUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  useEffect(() => {
    return () => {
      if (selectedUrl) {
        URL.revokeObjectURL(selectedUrl)
      }
    }
  }, [selectedUrl])

  const openPhoto = (photo: PhotoRecord) => {
    setActionError(null)
    if (selectedUrl) {
      URL.revokeObjectURL(selectedUrl)
    }
    setSelectedPhoto(photo)
    setSelectedUrl(URL.createObjectURL(photo.blob))
  }

  const closePhoto = () => {
    if (selectedUrl) {
      URL.revokeObjectURL(selectedUrl)
    }
    setSelectedPhoto(null)
    setSelectedUrl(null)
    setActionError(null)
  }

  const handleDownload = () => {
    if (!selectedPhoto) return
    setActionError(null)
    downloadPhoto(selectedPhoto.blob, buildPhotoFilename(selectedPhoto.mode))
  }

  const handleShare = async () => {
    if (!selectedPhoto) return

    setActionError(null)
    const filename = buildPhotoFilename(selectedPhoto.mode)

    try {
      const shared = await sharePhoto(selectedPhoto.blob, filename)
      if (!shared) {
        downloadPhoto(selectedPhoto.blob, filename)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Share failed.'
      setActionError(message)
    }
  }

  return (
    <main className="page gallery-page">
      <header className="page-header compact">
        <h1>Local gallery</h1>
        <p className="subtitle">
          {photos.length === 0
            ? 'Photos saved on this iPad during the party.'
            : `${photos.length} photo${photos.length === 1 ? '' : 's'} saved on this iPad.`}
        </p>
      </header>

      {photos.length === 0 ? (
        <p className="empty-state">No photos yet. Send guests to the booth!</p>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className="gallery-item"
              onClick={() => openPhoto(photo)}
            >
              <img
                src={thumbnailUrls.get(photo.id)}
                alt={`${photo.mode} photo`}
              />
              <span className="gallery-meta">
                {photo.mode} · {new Date(photo.createdAt).toLocaleTimeString()}
                {photo.uploaded ? ' · synced' : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      <Link to="/" className="btn btn-ghost btn-lg inline-link">
        Back to booth
      </Link>

      {selectedUrl && selectedPhoto ? (
        <div className="lightbox" onClick={closePhoto} role="presentation">
          <img
            src={selectedUrl}
            alt="Full size photobooth photo"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => void handleShare()}>
              {canShareFiles() ? 'Share' : 'Save photo'}
            </button>
            <button type="button" className="btn btn-outline btn-lg" onClick={handleDownload}>
              Download
            </button>
            <button type="button" className="btn btn-ghost" onClick={closePhoto}>
              Close
            </button>
          </div>
          {actionError ? <p className="status-message error">{actionError}</p> : null}
        </div>
      ) : null}
    </main>
  )
}
