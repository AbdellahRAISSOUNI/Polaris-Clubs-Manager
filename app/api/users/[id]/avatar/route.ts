import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo()
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Upload to Cloudinary
    const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = await import('@/lib/cloudinary')
    
    // Get existing user to check for old avatar
    const existingUser = await User.findOne({ id: params.id }).select('avatar_url').lean()
    
    // Delete old avatar from Cloudinary if it exists
    if (existingUser?.avatar_url) {
      const oldPublicId = extractPublicId(existingUser.avatar_url)
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId)
        } catch (error) {
          console.error('Error deleting old avatar:', error)
          // Continue even if deletion fails
        }
      }
    }

    // Upload new avatar to Cloudinary
    const uploadResult = await uploadToCloudinary(file, 'admin-profiles', `admin-${params.id}`)

    // Update the user record with the new avatar URL
    const updatedUser = await User.findOneAndUpdate(
      { id: params.id },
      { $set: { avatar_url: uploadResult.secure_url } },
      { new: true }
    ).lean()

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      message: 'Avatar uploaded successfully'
    })
  } catch (error: any) {
    console.error('Error in avatar upload:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process avatar upload' },
      { status: 500 }
    )
  }
}
