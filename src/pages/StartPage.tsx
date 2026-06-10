import { Link } from 'react-router-dom'
import { EVENT_CONFIG } from '../config/event'
import { ModeCard } from '../components/ModeCard'
import type { CaptureMode } from '../config/event'

interface StartPageProps {
  onSelectMode: (mode: CaptureMode) => void
}

export function StartPage({ onSelectMode }: StartPageProps) {
  return (
    <main className="page start-page">
      <header className="page-header">
        <p className="eyebrow text-label text-gold">Graduation Photobooth</p>
        <h1>{EVENT_CONFIG.graduateName}</h1>
        <p className="subtitle">{EVENT_CONFIG.classYear}</p>
      </header>

      <section className="mode-grid">
        <ModeCard
          mode="strip"
          title="Photo Strip"
          description="4 quick selfies stacked into a classic booth strip."
          onSelect={onSelectMode}
        />
        <ModeCard
          mode="single"
          title="Single Photo"
          description="One framed portrait with a countdown before capture."
          onSelect={onSelectMode}
        />
      </section>

      <footer className="start-footer">
        <Link to="/local" className="text-link">
          Local gallery
        </Link>
        <Link to="/gallery" className="text-link">
          Cloud gallery
        </Link>
      </footer>
    </main>
  )
}
