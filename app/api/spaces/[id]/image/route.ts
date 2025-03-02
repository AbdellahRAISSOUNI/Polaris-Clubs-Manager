import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get space details
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('image')
      .eq('id', params.id)
      .single();

    if (spaceError || !space) {
      return NextResponse.redirect(new URL('/spaces/default.jpg', request.url));
    }

    // If the space has a full URL for the image, redirect to it
    if (space.image && (space.image.startsWith('http://') || space.image.startsWith('https://'))) {
      return NextResponse.redirect(space.image);
    }

    // Get the public URL for the image from storage
    const { data } = supabase.storage
      .from('spaces')
      .getPublicUrl(`space-images/${params.id}`);

    // If we have a public URL, redirect to it
    if (data.publicUrl) {
      return NextResponse.redirect(data.publicUrl);
    }

    // If no image is found, redirect to default
    return NextResponse.redirect(new URL('/spaces/default.jpg', request.url));
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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload the file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('spaces')
      .upload(`space-images/${params.id}`, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading space image:', uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('spaces')
      .getPublicUrl(`space-images/${params.id}`);

    // Update the space record with the new image URL
    const { error: updateError } = await supabase
      .from('spaces')
      .update({ image: urlData.publicUrl })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating space with image URL:', updateError);
      return NextResponse.json(
        { error: "Failed to update space with image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Error in space image upload:', error);
    return NextResponse.json(
      { error: "Failed to process image upload" },
      { status: 500 }
    );
  }
} 