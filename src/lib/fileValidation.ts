// Shared image file validation for upload flows (Sell, Appraisal, ProVerify).
// Extracted to avoid triplicating identical validation logic.

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Please use JPEG, PNG, WebP, or GIF.` }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 10MB.` }
  }
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Invalid file extension: ${ext}` }
  }
  return { valid: true }
}

export async function validateMagicBytes(file: File): Promise<{ valid: boolean; error?: string }> {
  const blob = file.slice(0, 16)
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  const magicBytes: Record<string, number[]> = {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF - check WEBP at offset 8
    'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF87a or GIF89a
  }

  const magic = magicBytes[file.type]
  if (!magic) return { valid: false, error: 'Unknown file type' }

  if (file.type === 'image/webp') {
    if (bytes.length < 12) return { valid: false, error: 'File too small to verify' }
    const riff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    const webp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    if (!riff || !webp) return { valid: false, error: 'File content does not match WebP format' }
    return { valid: true }
  }

  if (file.type === 'image/gif') {
    if (bytes.length < 6) return { valid: false, error: 'File too small to verify' }
    const gif87a = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && bytes[4] === 0x37 && bytes[5] === 0x61
    const gif89a = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && bytes[4] === 0x39 && bytes[5] === 0x61
    if (!gif87a && !gif89a) return { valid: false, error: 'File content does not match GIF format' }
    return { valid: true }
  }

  if (bytes.length < magic.length) return { valid: false, error: 'File too small to verify' }
  const matches = magic.every((byte, i) => bytes[i] === byte)
  if (!matches) return { valid: false, error: `File content does not match ${file.type} format` }
  return { valid: true }
}
