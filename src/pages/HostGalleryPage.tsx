import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EVENT_CONFIG } from '../config/event'
import { fetchCloudGallery, isCloudConfigured, type CloudPhoto } from '../lib/cloudUpload'

export function HostGalleryPage() {
  const [photos, setPhotos] = useState<CloudPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<CloudPhoto | null>(null)

  useEffect(() => {
    if (!isCloudConfigured()) {
      setLoading(false)
      setError('Cloud gallery is not configured yet. Add Supabase keys to .env.')
      return
    }

    void fetchCloudGallery()
      .then((items) => {
        setPhotos(items)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load cloud gallery.')
        setLoading(false)
      })
  }, [])

  const refreshGallery = () => {
    setLoading(true)
    setError(null)
    void fetchCloudGallery()
      .then((items) => {
        setPhotos(items)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load cloud gallery.')
        setLoading(false)
      })
  }

  return (
    <main className="page gallery-page">
      <header className="page-header compact">
        <h1>Cloud gallery</h1>
        <p className="subtitle">
          {EVENT_CONFIG.graduateName} · {EVENT_CONFIG.classYear}
        </p>
      </header>

      <div className="gallery-toolbar">
        <button type="button" className="btn btn-outline" onClick={refreshGallery}>
          Refresh
        </button>
        <Link to="/" className="text-link">
          Back to booth
        </Link>
      </div>

      {loading ? <p className="empty-state">Loading gallery…</p> : null}
      {error ? <p className="status-message error">{error}</p> : null}

      {!loading && !error && photos.length === 0 ? (
        <p className="empty-state">No cloud photos yet. They appear here after upload.</p>
      ) : null}

      {!loading && photos.length > 0 ? (
        <div className="gallery-grid">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              className="gallery-item"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img src={photo.public_url} alt={`${photo.mode} photo`} loading="lazy" />
              <span className="gallery-meta">
                {photo.mode} · {new Date(photo.created_at).toLocaleTimeString()}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedPhoto ? (
        <div className="lightbox" onClick={() => setSelectedPhoto(null)} role="presentation">
          <img
            src={selectedPhoto.public_url}
            alt="Full size cloud photo"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={selectedPhoto.public_url}
            download
            className="btn btn-outline inline-link"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setSelectedPhoto(null)}
          >
            Close
          </button>
        </div>
      ) : null}
    </main>
  )
}
