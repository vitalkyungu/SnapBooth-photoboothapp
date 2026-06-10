export function canShareFiles(): boolean {
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
}

export async function sharePhoto(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: 'image/jpeg' })

  if (canShareFiles() && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'Photobooth photo',
      text: 'From the graduation photobooth!',
    })
    return true
  }

  return false
}

export function downloadPhoto(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function buildPhotoFilename(mode: 'strip' | 'single'): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `photobooth-${mode}-${stamp}.jpg`
}
