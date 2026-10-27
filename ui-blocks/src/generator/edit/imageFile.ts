// Reads a picture the person chose and makes it small enough to keep inside the page: scaled down, JPEG (or PNG for logos with a clear
// background), and below the size the photo operation accepts.
const MAX_CHARS = 440_000

export function readPicture(file: File, maxSize: number, keepTransparency = false, maxChars = MAX_CHARS): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const png = keepTransparency && (file.type === 'image/png' || file.type === 'image/svg+xml')
      if (png) return resolve(canvas.toDataURL('image/png'))
      // lower the quality until it fits
      let quality = 0.85
      let data = canvas.toDataURL('image/jpeg', quality)
      while (data.length > maxChars && quality > 0.3) {
        quality -= 0.1
        data = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(data)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This file is not a picture the browser can read.'))
    }
    image.src = url
  })
}
