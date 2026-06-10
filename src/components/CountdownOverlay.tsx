interface CountdownOverlayProps {
  count: number | null
  shotLabel?: string
}

export function CountdownOverlay({ count, shotLabel }: CountdownOverlayProps) {
  if (count === null) {
    return null
  }

  return (
    <div className="viewfinder__countdown">
      {shotLabel ? <p className="viewfinder__countdown-label">{shotLabel}</p> : null}
      <p className="viewfinder__countdown-number">{count}</p>
    </div>
  )
}
