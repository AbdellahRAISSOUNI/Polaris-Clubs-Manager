import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Club } from "@/models/Club";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    
    // Get the club to find the logo path
    const club = await Club.findOne({ id: params.id }).select('logo').lean();
    
    if (!club || !club.logo) {
      // If no club found or no logo, return default image
      return new Response(null, {
        status: 307, // Temporary redirect
        headers: {
          'Location': '/default-club-image.png'
        },
      });
    }

    // If the logo is already a full URL (Cloudinary or other), redirect to it
    if (club.logo.startsWith('http://') || club.logo.startsWith('https://')) {
      return new Response(null, {
        status: 307,
        headers: {
          'Location': club.logo
        },
      });
    }

    // If it's a relative path, redirect to it
    return new Response(null, {
      status: 307,
      headers: {
        'Location': club.logo.startsWith('/') ? club.logo : `/${club.logo}`
      },
    });
  } catch (error) {
    console.error('Error fetching club logo:', error);
    return new Response(null, {
      status: 307,
      headers: {
        'Location': '/default-club-image.png'
      },
    });
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
    
    // Get existing club to check for old logo
    const existingClub = await Club.findOne({ id: params.id }).select('logo').lean();
    
    // Delete old logo from Cloudinary if it exists
    if (existingClub?.logo) {
      const oldPublicId = extractPublicId(existingClub.logo);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (error) {
          console.error('Error deleting old logo:', error);
          // Continue even if deletion fails
        }
      }
    }

    // Upload new logo to Cloudinary
    const uploadResult = await uploadToCloudinary(file, 'clubs', `club-${params.id}`);

    // Update the club record with the new logo URL
    const updatedClub = await Club.findOneAndUpdate(
      { id: params.id },
      { $set: { logo: uploadResult.secure_url, updated_at: new Date() } },
      { new: true }
    );

    if (!updatedClub) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      message: "Logo uploaded successfully"
    });
  } catch (error: any) {
    console.error('Error in club logo upload:', error);
    return NextResponse.json(
      { error: error.message || "Failed to process logo upload" },
      { status: 500 }
    );
  }
} 