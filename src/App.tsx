import { useNavigate, Route, Routes } from 'react-router-dom'
import type { CaptureMode } from './config/event'
import { Navbar } from './components/Navbar'
import { startUploadRetryListener } from './lib/cloudUpload'
import { CameraPage } from './pages/CameraPage'
import { HostGalleryPage } from './pages/HostGalleryPage'
import { LocalGalleryPage } from './pages/LocalGalleryPage'
import { PreviewPage } from './pages/PreviewPage'
import { StartPage } from './pages/StartPage'
import { useEffect } from 'react'

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    return startUploadRetryListener()
  }, [])

  const handleSelectMode = (mode: CaptureMode) => {
    navigate(`/camera/${mode}`)
  }

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<StartPage onSelectMode={handleSelectMode} />} />
        <Route path="/camera/:mode" element={<CameraPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/local" element={<LocalGalleryPage />} />
        <Route path="/gallery" element={<HostGalleryPage />} />
      </Routes>
    </div>
  )
}
