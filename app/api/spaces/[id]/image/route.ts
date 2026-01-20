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

    // TODO: Implement file storage solution (Cloudinary, AWS S3, or local storage)
    // For now, we'll store a placeholder URL
    // In production, you should:
    // 1. Upload file to cloud storage (Cloudinary, AWS S3, etc.)
    // 2. Get the public URL
    // 3. Store the URL in MongoDB
    
    // Placeholder: Store a relative path
    // In a real implementation, upload to cloud storage first
    const imageUrl = `/spaces/${params.id}.jpg`; // Placeholder path

    // Update the space record with the new image URL
    const updatedSpace = await Space.findOneAndUpdate(
      { id: params.id },
      { image: imageUrl },
      { new: true }
    );

    if (!updatedSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      url: imageUrl,
      message: "Image URL updated. Note: File storage needs to be configured for actual file uploads."
    });
  } catch (error) {
    console.error('Error in space image upload:', error);
    return NextResponse.json(
      { error: "Failed to process image upload" },
      { status: 500 }
    );
  }
} 