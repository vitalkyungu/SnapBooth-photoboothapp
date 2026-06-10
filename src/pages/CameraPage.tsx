import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CountdownOverlay } from '../components/CountdownOverlay'
import { DelayPicker } from '../components/DelayPicker'
import { FilterPicker } from '../components/FilterPicker'
import {
  EVENT_CONFIG,
  type CaptureMode,
  type DelaySeconds,
  type PhotoFilter,
} from '../config/event'
import { useCamera } from '../hooks/useCamera'
import { useCountdown } from '../hooks/useCountdown'
import {
  captureFrameToCanvas,
  captureSquareFrameToCanvas,
  playShutterFeedback,
} from '../lib/capture'
import { applyPhotoFilterToCanvas, getFilterCss } from '../lib/filters'
import { composePhotoStrip, composeSinglePhoto } from '../lib/composeStrip'
import { uploadPhoto } from '../lib/cloudUpload'
import { createPhotoRecord, savePhoto } from '../lib/localGallery'
import type { PreviewState } from '../types'

export function CameraPage() {
  const { mode: modeParam } = useParams<{ mode: CaptureMode }>()
  const mode: CaptureMode = modeParam === 'single' ? 'single' : 'strip'
  const navigate = useNavigate()

  const [delay, setDelay] = useState<DelaySeconds>(5)
  const [filter, setFilter] = useState<PhotoFilter>('normal')
  const [isCapturing, setIsCapturing] = useState(false)
  const [shotLabel, setShotLabel] = useState<string | undefined>()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const { videoRef, error, isReady, isStarting, startCamera, stopCamera } = useCamera()
  const { count, isRunning, startCountdown, cancelCountdown } = useCountdown()

  useEffect(() => {
    return () => {
      cancelCountdown()
    }
  }, [cancelCountdown])

  const finishCapture = useCallback(
    async (blob: Blob) => {
      const record = await createPhotoRecord(mode, blob)
      await savePhoto(record)

      void uploadPhoto(record)

      const previewState: PreviewState = {
        photoId: record.id,
        mode,
        imageUrl: URL.createObjectURL(blob),
      }

      stopCamera()
      navigate('/preview', { state: previewState })
    },
    [mode, navigate, stopCamera],
  )

  const runCaptureSequence = useCallback(async () => {
    if (!videoRef.current || !isReady || isCapturing) {
      return
    }

    setIsCapturing(true)
    setStatusMessage(null)

    try {
      if (mode === 'single') {
        setShotLabel(undefined)
        await startCountdown(delay)
        playShutterFeedback()
        const frame = captureFrameToCanvas(videoRef.current)
        const filtered = applyPhotoFilterToCanvas(frame, filter)
        const composed = await composeSinglePhoto(filtered)
        await finishCapture(composed)
        return
      }

      const frames: HTMLCanvasElement[] = []
      const totalShots = EVENT_CONFIG.stripPhotoCount

      for (let shot = 1; shot <= totalShots; shot += 1) {
        setShotLabel(`Photo ${shot} of ${totalShots}`)
        await startCountdown(delay)
        playShutterFeedback()
        const frame = captureSquareFrameToCanvas(videoRef.current)
        const filtered = applyPhotoFilterToCanvas(frame, filter)
        frames.push(filtered)

        if (shot < totalShots) {
          setStatusMessage('Get ready for the next shot…')
          await new Promise((resolve) => window.setTimeout(resolve, 800))
        }
      }

      setShotLabel(undefined)
      const strip = await composePhotoStrip(frames)
      await finishCapture(strip)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Capture failed.'
      setStatusMessage(message)
      setIsCapturing(false)
      setShotLabel(undefined)
    }
  }, [
    delay,
    filter,
    finishCapture,
    isCapturing,
    isReady,
    mode,
    startCountdown,
    videoRef,
  ])

  const handleBack = () => {
    cancelCountdown()
    stopCamera()
    navigate('/')
  }

  return (
    <main className="page camera-page">
      <div className="camera-shell">
        <video
          ref={videoRef}
          className="camera-preview"
          style={{ filter: getFilterCss(filter) }}
          playsInline
          muted
          autoPlay
        />

        <CountdownOverlay count={count} shotLabel={shotLabel} />

        {!isReady && !error ? (
          <div className="camera-loading">
            <p>{isStarting ? 'Starting camera…' : 'Camera is off'}</p>
            {!isStarting ? (
              <button type="button" className="btn btn-primary btn-lg camera-retry" onClick={() => void startCamera()}>
                Turn on camera
              </button>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            <button type="button" className="btn btn-primary btn-lg camera-retry" onClick={() => void startCamera()}>
              Try again
            </button>
          </div>
        ) : null}
      </div>

      <section className="camera-controls">
        <p className="control-label text-label">Filter</p>
        <FilterPicker
          value={filter}
          onChange={setFilter}
          disabled={isCapturing || isRunning}
        />

        <p className="control-label text-label">Countdown</p>
        <DelayPicker
          value={delay}
          onChange={setDelay}
          disabled={isCapturing || isRunning}
        />

        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => void runCaptureSequence()}
          disabled={!isReady || isCapturing || isRunning}
        >
          {mode === 'strip' ? 'Start strip' : 'Take photo'}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-lg"
          onClick={handleBack}
          disabled={isCapturing || isRunning}
        >
          Back
        </button>

        {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
      </section>
    </main>
  )
}
