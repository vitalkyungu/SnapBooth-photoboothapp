import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPhotos } from '../lib/localGallery'
import type { PhotoRecord } from '../types'

export function LocalGalleryPage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map())
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

  useEffect(() => {
    void getAllPhotos().then(setPhotos)
  }, [])

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
    if (selectedUrl) {
      URL.revokeObjectURL(selectedUrl)
    }
    setSelectedUrl(URL.createObjectURL(photo.blob))
  }

  const closePhoto = () => {
    if (selectedUrl) {
      URL.revokeObjectURL(selectedUrl)
    }
    setSelectedUrl(null)
  }

  return (
    <main className="page gallery-page">
      <header className="page-header compact">
        <h1>Local gallery</h1>
        <p className="subtitle">Photos saved on this iPad during the party.</p>
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

      {selectedUrl ? (
        <div className="lightbox" onClick={closePhoto} role="presentation">
          <img src={selectedUrl} alt="Full size photobooth photo" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="btn btn-ghost" onClick={closePhoto}>
            Close
          </button>
        </div>
      ) : null}
    </main>
  )
}
