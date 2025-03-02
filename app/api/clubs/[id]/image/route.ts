import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First get the club to find the logo path
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('logo')
      .eq('id', params.id)
      .single();
    
    if (clubError || !club?.logo) {
      // If no club found or no logo, return default image
      return new Response(null, {
        status: 307, // Temporary redirect
        headers: {
          'Location': '/default-club-image.png'
        },
      });
    }

    // If the logo is already a full URL (e.g., from previous implementation), return it
    if (club.logo.startsWith('http')) {
      return new Response(null, {
        status: 307,
        headers: {
          'Location': club.logo
        },
      });
    }

    // Get the public URL for the logo from Supabase storage
    const { data } = supabase.storage
      .from('clubs')
      .getPublicUrl(club.logo);

    if (!data.publicUrl) {
      return new Response(null, {
        status: 307,
        headers: {
          'Location': '/default-club-image.png'
        },
      });
    }

    // Redirect to the public URL
    return new Response(null, {
      status: 307,
      headers: {
        'Location': data.publicUrl
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