/**
 * Image compression and file utilities for property photos and documents.
 */

/**
 * Compress a JPEG image to reduce file size while maintaining quality.
 * Uses Canvas API to resize and recompress the image.
 * 
 * @param file - The original image file
 * @param maxWidth - Maximum width (default: 1920px)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<Blob> - Compressed JPEG blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Generate a clean filename from property address.
 * Converts address to slug format: "123-main-street-london-sw1a-1aa"
 * 
 * @param address - Property address
 * @param postcode - Property postcode
 * @returns string - Sanitized address slug
 */
export function generateAddressSlug(address: string, postcode?: string): string {
  // Combine address and postcode
  const fullAddress = postcode 
    ? `${address} ${postcode}` 
    : address
  
  // Convert to lowercase and replace spaces/special chars with hyphens
  return fullAddress
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Generate a descriptive filename for property photos.
 * Format: "{address-slug}_{timestamp}_{index}.jpg"
 * Example: "123-main-street-sw1a-1aa_1718000000_0.jpg"
 * 
 * @param address - Property address
 * @param postcode - Property postcode
 * @param index - Photo index number
 * @param originalName - Original filename (for extension)
 * @returns string - New filename
 */
export function generatePhotoFilename(
  address: string,
  postcode: string | undefined,
  index: number,
  originalName: string
): string {
  const slug = generateAddressSlug(address, postcode)
  const timestamp = Date.now()
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  
  // Ensure JPEG extension
  const finalExt = ['jpg', 'jpeg'].includes(ext) ? 'jpg' : ext
  
  return `${slug}_${timestamp}_${index}.${finalExt}`
}

/**
 * Check if a file is a JPEG image.
 */
export function isJPEG(file: File): boolean {
  return file.type === 'image/jpeg' || 
         file.type === 'image/jpg' ||
         file.name.toLowerCase().endsWith('.jpg') ||
         file.name.toLowerCase().endsWith('.jpeg')
}

/**
 * Check if a file is an image.
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
