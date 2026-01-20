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

    // If the logo is already a full URL, redirect to it
    if (club.logo.startsWith('http://') || club.logo.startsWith('https://')) {
      return new Response(null, {
        status: 307,
        headers: {
          'Location': club.logo
        },
      });
    }

    // If it's a relative path, redirect to it
    // Note: For production, you may want to use a CDN or file storage service
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