import { coverCropToCanvas, downscaleToCanvas, JPEG_QUALITY } from './capture'
import { EVENT_CONFIG } from '../config/event'

const PADDING = 20
const FOOTER_HEIGHT = 100
const PHOTO_SLOT_WIDTH = 560

const STRIP_WIDTH = 600
const STRIP_HEIGHT = 700
const STRIP_SLOT_SIZE = 270
const STRIP_PHOTO_SLOTS = [
  { x: 20, y: 20 },
  { x: 310, y: 20 },
  { x: 20, y: 300 },
  { x: 310, y: 300 },
] as const
const STRIP_GRID_BOTTOM = STRIP_PHOTO_SLOTS[2].y + STRIP_SLOT_SIZE

const SINGLE_WIDTH = 600
const SINGLE_HEIGHT = 500
const SINGLE_SLOT_HEIGHT = 380

const ICON_URL = '/snapbooth-icon.png'
const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const MIN_RAW_FONT_PX = 24

let iconCache: Promise<HTMLImageElement> | null = null

function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1
}

/** Logical font size — always at least 24px on the raw (physical) canvas. */
function footerFontSize(logicalSize: number): number {
  return Math.max(logicalSize, MIN_RAW_FONT_PX / getDevicePixelRatio())
}

function createHiDpiCanvas(
  logicalWidth: number,
  logicalHeight: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; dpr: number } {
  const dpr = getDevicePixelRatio()
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(logicalWidth * dpr)
  canvas.height = Math.round(logicalHeight * dpr)
  canvas.style.width = `${logicalWidth}px`
  canvas.style.height = `${logicalHeight}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create canvas context.')
  }

  ctx.scale(dpr, dpr)
  prepareContext(ctx)

  return { canvas, ctx, dpr }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

async function loadIcon(): Promise<HTMLImageElement> {
  if (!iconCache) {
    iconCache = loadImage(ICON_URL)
  }

  const icon = await iconCache
  if (!icon.complete || icon.naturalWidth === 0) {
    await new Promise<void>((resolve, reject) => {
      icon.onload = () => resolve()
      icon.onerror = () => reject(new Error('Failed to load branding icon.'))
    })
  }

  return icon
}

function prepareContext(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
}

function drawSquareToSlot(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  destX: number,
  destY: number,
  destSize: number,
  dpr: number,
): void {
  const scaled = downscaleToCanvas(source, destSize * dpr, destSize * dpr)
  ctx.drawImage(scaled, destX, destY, destSize, destSize)
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  logicalWidth: number,
  footerTop: number,
  footerHeight: number,
  icon: HTMLImageElement,
): void {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const iconSize = 30
  const lineGap = 7
  const rowGap = 12
  const brandFontSize = footerFontSize(16)
  const dateFontSize = footerFontSize(13)
  const nameFontSize = footerFontSize(15)
  const classFontSize = footerFontSize(12)

  ctx.font = `600 ${brandFontSize}px ${FONT_FAMILY}`
  const snapWidth = ctx.measureText('Snap').width
  const boothWidth = ctx.measureText('Booth').width
  const brandTextWidth = snapWidth + boothWidth

  ctx.font = `500 ${dateFontSize}px ${FONT_FAMILY}`
  const dateWidth = ctx.measureText(dateStr).width

  const brandRowWidth = iconSize + rowGap + brandTextWidth + rowGap + dateWidth
  const blockHeight = iconSize + lineGap + nameFontSize + lineGap + classFontSize
  let y = footerTop + (footerHeight - blockHeight) / 2
  const brandStartX = (logicalWidth - brandRowWidth) / 2

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(icon, brandStartX, y, iconSize, iconSize)

  const textX = brandStartX + iconSize + rowGap
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  ctx.font = `600 ${brandFontSize}px ${FONT_FAMILY}`
  ctx.fillStyle = '#1A1917'
  ctx.fillText('Snap', textX, y + 1)
  ctx.fillStyle = '#C9A84C'
  ctx.fillText('Booth', textX + snapWidth, y + 1)

  ctx.font = `500 ${dateFontSize}px ${FONT_FAMILY}`
  ctx.fillStyle = '#5A5652'
  ctx.fillText(dateStr, textX + brandTextWidth + rowGap, y + 4)

  y += iconSize + lineGap

  ctx.font = `600 ${nameFontSize}px ${FONT_FAMILY}`
  ctx.fillStyle = '#1A1917'
  ctx.textAlign = 'center'
  ctx.fillText(EVENT_CONFIG.graduateName, logicalWidth / 2, y)

  y += nameFontSize + lineGap

  ctx.font = `500 ${classFontSize}px ${FONT_FAMILY}`
  ctx.fillStyle = '#9A9690'
  ctx.fillText(EVENT_CONFIG.classYear, logicalWidth / 2, y)
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to compose photo.'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export async function composeSinglePhoto(frame: HTMLCanvasElement): Promise<Blob> {
  const icon = await loadIcon()
  const { canvas, ctx, dpr } = createHiDpiCanvas(SINGLE_WIDTH, SINGLE_HEIGHT)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SINGLE_WIDTH, SINGLE_HEIGHT)

  const photoSlot = coverCropToCanvas(
    frame,
    PHOTO_SLOT_WIDTH * dpr,
    SINGLE_SLOT_HEIGHT * dpr,
  )
  ctx.drawImage(photoSlot, PADDING, PADDING, PHOTO_SLOT_WIDTH, SINGLE_SLOT_HEIGHT)

  const footerTop = SINGLE_HEIGHT - FOOTER_HEIGHT
  drawFooter(ctx, SINGLE_WIDTH, footerTop, FOOTER_HEIGHT, icon)

  return canvasToBlob(canvas)
}

export async function composePhotoStrip(frames: HTMLCanvasElement[]): Promise<Blob> {
  const icon = await loadIcon()
  const { canvas, ctx, dpr } = createHiDpiCanvas(STRIP_WIDTH, STRIP_HEIGHT)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT)

  const slotCount = Math.min(frames.length, STRIP_PHOTO_SLOTS.length)
  for (let i = 0; i < slotCount; i += 1) {
    const slot = STRIP_PHOTO_SLOTS[i]
    const frame = frames[i]
    drawSquareToSlot(ctx, frame, slot.x, slot.y, STRIP_SLOT_SIZE, dpr)
  }

  const footerTop = STRIP_GRID_BOTTOM
  const footerHeight = STRIP_HEIGHT - footerTop - PADDING
  drawFooter(ctx, STRIP_WIDTH, footerTop, footerHeight, icon)

  return canvasToBlob(canvas)
}
