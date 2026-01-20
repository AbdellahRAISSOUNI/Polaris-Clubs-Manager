import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Space } from "@/models/Space";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    
    // Get space details
    const space = await Space.findOne({ id: params.id }).select('image').lean();

    if (!space || !space.image) {
      return NextResponse.redirect(new URL('/spaces/default.jpg', request.url));
    }

    // If the space has a full URL for the image, redirect to it
    if (space.image.startsWith('http://') || space.image.startsWith('https://')) {
      return NextResponse.redirect(space.image);
    }

    // If it's a relative path, redirect to it
    // Note: For production, you may want to use a CDN or file storage service
    const imagePath = space.image.startsWith('/') ? space.image : `/${space.image}`;
    return NextResponse.redirect(new URL(imagePath, request.url));
  } catch (error) {
    console.error('Error fetching space image:', error);
    return NextResponse.redirect(new URL('/spaces/default.jpg', request.url));
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = await import('@/lib/cloudinary');
    
    // Get existing space to check for old image
    const existingSpace = await Space.findOne({ id: params.id }).select('image').lean();
    
    // Delete old image from Cloudinary if it exists
    if (existingSpace?.image) {
      const oldPublicId = extractPublicId(existingSpace.image);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue even if deletion fails
        }
      }
    }

    // Upload new image to Cloudinary
    const uploadResult = await uploadToCloudinary(file, 'spaces', `space-${params.id}`);

    // Update the space record with the new image URL
    const updatedSpace = await Space.findOneAndUpdate(
      { id: params.id },
      { $set: { image: uploadResult.secure_url, updated_at: new Date() } },
      { new: true }
    );

    if (!updatedSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      message: "Image uploaded successfully"
    });
  } catch (error: any) {
    console.error('Error in space image upload:', error);
    return NextResponse.json(
      { error: error.message || "Failed to process image upload" },
      { status: 500 }
    );
  }
} 