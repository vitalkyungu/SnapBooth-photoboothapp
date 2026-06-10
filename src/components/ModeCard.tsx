import type { CaptureMode } from '../config/event'

interface ModeCardProps {
  mode: CaptureMode
  title: string
  description: string
  onSelect: (mode: CaptureMode) => void
}

export function ModeCard({ mode, title, description, onSelect }: ModeCardProps) {
  return (
    <button type="button" className="mode-card" onClick={() => onSelect(mode)}>
      <span className="mode-card-title">{title}</span>
      <span className="mode-card-description">{description}</span>
    </button>
  )
}
