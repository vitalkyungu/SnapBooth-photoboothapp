export const JPEG_QUALITY = 0.98

async function captureStillBitmap(
  video: HTMLVideoElement,
): Promise<ImageBitmap | null> {
  const stream = video.srcObject
  if (!(stream instanceof MediaStream)) {
    return null
  }

  const track = stream.getVideoTracks()[0]
  if (!track || typeof ImageCapture === 'undefined') {
    return null
  }

  try {
    const capture = new ImageCapture(track)
    const blob = await capture.takePhoto()
    return createImageBitmap(blob)
  } catch {
    return null
  }
}

function drawSourceToCanvas(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  mirror: boolean,
): void {
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (mirror) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }

  ctx.drawImage(source, 0, 0, width, height)
}

export async function captureFrameToCanvas(
  video: HTMLVideoElement,
  mirror = true,
): Promise<HTMLCanvasElement> {
  const still = await captureStillBitmap(video)
  const width = still?.width ?? video.videoWidth
  const height = still?.height ?? video.videoHeight

  if (!width || !height) {
    still?.close()
    throw new Error('Camera is not ready yet.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    still?.close()
    throw new Error('Could not create canvas context.')
  }

  drawSourceToCanvas(ctx, still ?? video, width, height, mirror)
  still?.close()

  return canvas
}

/** Center-crop a square at the camera's full native resolution. */
export async function captureSquareFrameToCanvas(
  video: HTMLVideoElement,
  mirror = true,
): Promise<HTMLCanvasElement> {
  const still = await captureStillBitmap(video)
  const width = still?.width ?? video.videoWidth
  const height = still?.height ?? video.videoHeight

  if (!width || !height) {
    still?.close()
    throw new Error('Camera is not ready yet.')
  }

  const cropSize = Math.min(width, height)
  const srcX = (width - cropSize) / 2
  const srcY = (height - cropSize) / 2

  const canvas = document.createElement('canvas')
  canvas.width = cropSize
  canvas.height = cropSize

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    still?.close()
    throw new Error('Could not create canvas context.')
  }

  ctx.imageSmoothingEnabled = false

  const source = still ?? video

  if (mirror) {
    ctx.translate(cropSize, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(source, srcX, srcY, cropSize, cropSize, 0, 0, cropSize, cropSize)
  } else {
    ctx.drawImage(source, srcX, srcY, cropSize, cropSize, 0, 0, cropSize, cropSize)
  }

  still?.close()

  return canvas
}

export function coverCropToCanvas(
  source: HTMLCanvasElement,
  destWidth: number,
  destHeight: number,
): HTMLCanvasElement {
  const srcW = source.width
  const srcH = source.height
  const slotRatio = destWidth / destHeight
  const imgRatio = srcW / srcH

  let cropX = 0
  let cropY = 0
  let cropW = srcW
  let cropH = srcH

  if (imgRatio > slotRatio) {
    cropW = srcH * slotRatio
    cropX = (srcW - cropW) / 2
  } else {
    cropH = srcW / slotRatio
    cropY = (srcH - cropH) / 2
  }

  const cropped = document.createElement('canvas')
  cropped.width = cropW
  cropped.height = cropH
  const croppedCtx = cropped.getContext('2d')
  if (!croppedCtx) {
    throw new Error('Could not create canvas context.')
  }
  croppedCtx.imageSmoothingEnabled = false
  croppedCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

  return downscaleToCanvas(cropped, destWidth, destHeight)
}

export function downscaleToCanvas(
  source: HTMLCanvasElement,
  destWidth: number,
  destHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = destWidth
  canvas.height = destHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create canvas context.')
  }

  const srcW = source.width
  const srcH = source.height

  if (srcW > destWidth * 2 || srcH > destHeight * 2) {
    const midW = Math.max(destWidth, Math.round(srcW / 2))
    const midH = Math.max(destHeight, Math.round(srcH / 2))
    const mid = document.createElement('canvas')
    mid.width = midW
    mid.height = midH
    const midCtx = mid.getContext('2d')!
    midCtx.imageSmoothingEnabled = true
    midCtx.imageSmoothingQuality = 'high'
    midCtx.drawImage(source, 0, 0, srcW, srcH, 0, 0, midW, midH)

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(mid, 0, 0, midW, midH, 0, 0, destWidth, destHeight)
  } else {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, 0, 0, srcW, srcH, 0, 0, destWidth, destHeight)
  }

  return canvas
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to export photo.'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export function playShutterFeedback(): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }

  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 880
    gain.gain.value = 0.08
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.08)
  } catch {
    // Audio may be blocked until user gesture; ignore.
  }
}
