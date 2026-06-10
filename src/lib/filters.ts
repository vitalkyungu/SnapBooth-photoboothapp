import type { PhotoFilter } from '../config/event'

export function getFilterCss(filter: PhotoFilter): string {
  switch (filter) {
    case 'cinematic':
      return 'contrast(1.2) saturate(0.75) sepia(0.25) hue-rotate(-15deg) brightness(0.95)'
    case 'bw':
      return 'grayscale(100%) contrast(1.1)'
    case 'anime':
      return 'saturate(1.6) contrast(1.4) brightness(1.08)'
    default:
      return 'none'
  }
}

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Could not create canvas context.')
  }
  ctx.drawImage(source, 0, 0)
  return canvas
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value))
}

function applyGrayscale(imageData: ImageData, contrast = 1.1): void {
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    gray = (gray - 128) * contrast + 128
    gray = clamp(gray)
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }
}

function applyCinematic(imageData: ImageData): void {
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    let nr = r * 0.93 + g * 0.77 + b * 0.57
    let ng = r * 0.7 + g * 0.88 + b * 0.6
    let nb = r * 0.5 + g * 0.68 + b * 0.9

    nr = (nr - 128) * 1.15 + 128
    ng = (ng - 128) * 1.15 + 128
    nb = (nb - 128) * 1.15 + 128

    const avg = (nr + ng + nb) / 3
    nr = avg + (nr - avg) * 0.75
    ng = avg + (ng - avg) * 0.75
    nb = avg + (nb - avg) * 0.75

    data[i] = clamp(nr * 0.95)
    data[i + 1] = clamp(ng * 0.95)
    data[i + 2] = clamp(nb * 0.95)
  }
}

function posterize(imageData: ImageData, levels: number): void {
  const step = 255 / (levels - 1)
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step
    data[i + 1] = Math.round(data[i + 1] / step) * step
    data[i + 2] = Math.round(data[i + 2] / step) * step
  }
}

function applyAnime(imageData: ImageData): void {
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    const avg = (r + g + b) / 3
    r = avg + (r - avg) * 1.6
    g = avg + (g - avg) * 1.6
    b = avg + (b - avg) * 1.6

    r = (r - 128) * 1.4 + 128
    g = (g - 128) * 1.4 + 128
    b = (b - 128) * 1.4 + 128

    r *= 1.08
    g *= 1.08
    b *= 1.08

    data[i] = clamp(r)
    data[i + 1] = clamp(g)
    data[i + 2] = clamp(b)
  }

  posterize(imageData, 5)
}

function applyPixelFilter(imageData: ImageData, filter: PhotoFilter): void {
  switch (filter) {
    case 'bw':
      applyGrayscale(imageData)
      break
    case 'cinematic':
      applyCinematic(imageData)
      break
    case 'anime':
      applyAnime(imageData)
      break
    default:
      break
  }
}

export function applyPhotoFilterToCanvas(
  source: HTMLCanvasElement,
  filter: PhotoFilter,
): HTMLCanvasElement {
  if (filter === 'normal') {
    return source
  }

  const canvas = cloneCanvas(source)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Could not create canvas context.')
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  applyPixelFilter(imageData, filter)
  ctx.putImageData(imageData, 0, 0)

  return canvas
}
