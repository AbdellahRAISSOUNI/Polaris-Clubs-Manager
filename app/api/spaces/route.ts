import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Space } from "@/models/Space";
import { Reservation } from "@/models/Reservation";
import { randomUUID } from "crypto";

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

// Mock data for initial setup - will be used if MongoDB connection fails
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
    await connectMongo();
    
    // Fetch spaces from MongoDB
    const spaces = await Space.find({}).lean();
    
    // Transform MongoDB documents to match expected format (convert _id to id, handle dates)
    const transformedSpaces = spaces.map(space => ({
      id: space.id,
      name: space.name,
      capacity: space.capacity,
      features: space.features || [],
      image: space.image || "/placeholder.jpg",
      description: space.description,
      is_active: space.is_active !== undefined ? space.is_active : true,
      created_at: space.created_at ? new Date(space.created_at).toISOString() : new Date().toISOString(),
    }));
    
    // Add caching headers for better performance (5 minutes cache)
    return NextResponse.json(transformedSpaces, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Error in spaces API:", error);
    // Fall back to mock data if there's an error
    return NextResponse.json(mockSpaces);
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.capacity) {
      return NextResponse.json(
        { error: "Name and capacity are required" },
        { status: 400 }
      );
    }
    
    // Create new space with generated ID
    const newSpace = new Space({
      id: randomUUID(),
      name: body.name,
      capacity: body.capacity,
      features: body.features || [],
      image: body.image || "/placeholder.jpg",
      description: body.description,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_at: new Date(),
    });
    
    const savedSpace = await newSpace.save();
    
    // Transform to match expected format
    const transformedSpace = {
      id: savedSpace.id,
      name: savedSpace.name,
      capacity: savedSpace.capacity,
      features: savedSpace.features || [],
      image: savedSpace.image || "/placeholder.jpg",
      description: savedSpace.description,
      is_active: savedSpace.is_active !== undefined ? savedSpace.is_active : true,
      created_at: savedSpace.created_at ? new Date(savedSpace.created_at).toISOString() : new Date().toISOString(),
    };
    
    return NextResponse.json(transformedSpace, { status: 201 });
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
    await connectMongo();
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.name || !body.capacity) {
      return NextResponse.json(
        { error: "ID, name, and capacity are required" },
        { status: 400 }
      );
    }
    
    // Update in MongoDB
    const updatedSpace = await Space.findOneAndUpdate(
      { id: body.id },
      {
        name: body.name,
        capacity: body.capacity,
        features: body.features || [],
        image: body.image || "/placeholder.jpg",
        description: body.description,
        is_active: body.is_active !== undefined ? body.is_active : true,
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }
    
    // Transform to match expected format
    const transformedSpace = {
      id: updatedSpace.id,
      name: updatedSpace.name,
      capacity: updatedSpace.capacity,
      features: updatedSpace.features || [],
      image: updatedSpace.image || "/placeholder.jpg",
      description: updatedSpace.description,
      is_active: updatedSpace.is_active !== undefined ? updatedSpace.is_active : true,
      created_at: updatedSpace.created_at ? new Date(updatedSpace.created_at).toISOString() : new Date().toISOString(),
    };
    
    return NextResponse.json(transformedSpace);
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
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Space ID is required" },
        { status: 400 }
      );
    }
    
    // Check if space has reservations
    const reservationCount = await Reservation.countDocuments({ space_id: id });
    
    if (reservationCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete space with existing reservations" },
        { status: 400 }
      );
    }
    
    // Delete from MongoDB
    const result = await Space.findOneAndDelete({ id });
    
    if (!result) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
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