import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
} else {
  console.warn('⚠️  Cloudinary credentials not found. File uploads will not work.')
}

/**
 * Upload a file to Cloudinary
 * @param file - File object or Buffer
 * @param folder - Folder path in Cloudinary (e.g., 'clubs', 'spaces', 'admin-profiles')
 * @param publicId - Optional public ID for the file
 * @returns Promise with the uploaded file URL and public_id
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; public_id: string; secure_url: string }> {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.')
    }

    // Convert File to Buffer if needed
    let buffer: Buffer
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }

    // Convert Buffer to a stream
    const stream = Readable.from(buffer)

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `polaris-clubs-manager/${folder}`,
          public_id: publicId,
          resource_type: 'auto', // Automatically detect image/video
          overwrite: true,
          transformation: [
            {
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else if (result) {
            resolve({
              url: result.url,
              secure_url: result.secure_url,
              public_id: result.public_id,
            })
          } else {
            reject(new Error('Upload failed: No result returned'))
          }
        }
      )

      stream.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    throw error
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @returns Promise with deletion result
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw error
  }
}

/**
 * Check if a URL is a Cloudinary URL
 * @param url - URL to check
 * @returns boolean
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com')
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns public_id or null
 */
export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) {
    return null
  }

  try {
    // Extract public_id from URL pattern: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    const match = url.match(/\/upload\/[^/]+\/(.+)$/)
    if (match && match[1]) {
      // Remove file extension
      return match[1].replace(/\.[^/.]+$/, '')
    }
    return null
  } catch (error) {
    console.error('Error extracting public_id:', error)
    return null
  }
}

/**
 * Get optimized image URL from Cloudinary
 * @param url - Cloudinary URL
 * @param width - Optional width
 * @param height - Optional height
 * @param quality - Optional quality (auto, 80, 90, etc.)
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality: string | number = 'auto'
): string {
  if (!isCloudinaryUrl(url)) {
    return url
  }

  try {
    const publicId = extractPublicId(url)
    if (!publicId) {
      return url
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const transformations: string[] = []

    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    if (quality) transformations.push(`q_${quality}`)
    transformations.push('f_auto', 'c_auto') // Auto format and crop

    const transformString = transformations.join(',')
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`
  } catch (error) {
    console.error('Error generating optimized URL:', error)
    return url
  }
}
