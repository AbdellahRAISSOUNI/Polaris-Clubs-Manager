import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Mock data for initial setup - will be used if Supabase connection fails
const mockSpaces = [
  {
    id: "1",
    name: "Main Auditorium",
    capacity: 200,
    features: ["Stage", "Sound System", "Projector"],
    image: "/spaces/auditorium.jpg",
  },
  {
    id: "2",
    name: "Conference Room A",
    capacity: 50,
    features: ["Whiteboard", "Projector", "Video Conferencing"],
    image: "/spaces/conference-a.jpg",
  },
  {
    id: "3",
    name: "Conference Room B",
    capacity: 30,
    features: ["Whiteboard", "TV Screen"],
    image: "/spaces/conference-b.jpg",
  },
  {
    id: "4",
    name: "Student Lounge",
    capacity: 100,
    features: ["Casual Seating", "Kitchenette"],
    image: "/spaces/lounge.jpg",
  },
  {
    id: "5",
    name: "Outdoor Courtyard",
    capacity: 150,
    features: ["Open Air", "Power Outlets"],
    image: "/spaces/courtyard.jpg",
  },
];

export async function GET() {
  try {
    // Fetch spaces from Supabase
    const { data, error } = await supabase
      .from('spaces')
      .select('*');
    
    if (error) {
      console.error("Error fetching spaces:", error);
      // Fall back to mock data if there's an error
      return NextResponse.json(mockSpaces);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in spaces API:", error);
    // Fall back to mock data if there's an error
    return NextResponse.json(mockSpaces);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.capacity) {
      return NextResponse.json(
        { error: "Name and capacity are required" },
        { status: 400 }
      );
    }
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('spaces')
      .insert({
        name: body.name,
        capacity: body.capacity,
        features: body.features || [],
        image: body.image || "/spaces/default.jpg",
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating space:", error);
      return NextResponse.json(
        { error: "Failed to create space" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in spaces API:", error);
    return NextResponse.json(
      { error: "Failed to create space" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.name || !body.capacity) {
      return NextResponse.json(
        { error: "ID, name, and capacity are required" },
        { status: 400 }
      );
    }
    
    // Update in Supabase
    const { data, error } = await supabase
      .from('spaces')
      .update({
        name: body.name,
        capacity: body.capacity,
        features: body.features || [],
        image: body.image || "/spaces/default.jpg",
      })
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating space:", error);
      return NextResponse.json(
        { error: "Failed to update space" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in spaces API:", error);
    return NextResponse.json(
      { error: "Failed to update space" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Space ID is required" },
        { status: 400 }
      );
    }
    
    // Check if space has reservations
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id')
      .eq('space_id', id)
      .limit(1);
    
    if (reservationError) {
      console.error("Error checking reservations:", reservationError);
      return NextResponse.json(
        { error: "Failed to check if space has reservations" },
        { status: 500 }
      );
    }
    
    if (reservations && reservations.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete space with existing reservations" },
        { status: 400 }
      );
    }
    
    // Delete from Supabase
    const { error } = await supabase
      .from('spaces')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting space:", error);
      return NextResponse.json(
        { error: "Failed to delete space" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in spaces API:", error);
    return NextResponse.json(
      { error: "Failed to delete space" },
      { status: 500 }
    );
  }
} 