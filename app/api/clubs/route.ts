import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Club } from "@/models/Club";
import { randomUUID } from "crypto";

// Mock data for initial setup - will be used if MongoDB connection fails
// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

const mockClubs = [
  {
    id: "1",
    name: "Computer Science Club",
    description: "A club for students interested in computer science and programming",
    email: "cs-club@example.com",
    logo: "/clubs/cs-club.jpg",
    members: 45,
    created_at: "2022-09-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Debate Society",
    description: "Fostering critical thinking through competitive debate",
    email: "debate@example.com",
    logo: "/clubs/debate.jpg",
    members: 30,
    created_at: "2022-08-15T00:00:00Z",
  },
  {
    id: "3",
    name: "Photography Club",
    description: "Exploring the art of photography together",
    email: "photo-club@example.com",
    logo: "/clubs/photography.jpg",
    members: 25,
    created_at: "2022-10-05T00:00:00Z",
  },
  {
    id: "4",
    name: "Chess Club",
    description: "For chess enthusiasts of all skill levels",
    email: "chess@example.com",
    logo: "/clubs/chess.jpg",
    members: 20,
    created_at: "2023-01-10T00:00:00Z",
  },
  {
    id: "5",
    name: "Environmental Action",
    description: "Working together for a sustainable campus and community",
    email: "eco-action@example.com",
    logo: "/clubs/environmental.jpg",
    members: 35,
    created_at: "2022-11-20T00:00:00Z",
  },
];

export async function GET(request: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      // Fetch a single club by ID
      const club = await Club.findOne({ id }).lean();
      
      if (!club) {
        // Fall back to mock data if not found
        const mockClub = mockClubs.find((c) => c.id === id);
        if (mockClub) {
          return NextResponse.json(mockClub);
        }
        return NextResponse.json({ error: "Club not found" }, { status: 404 });
      }
      
      // Transform to match expected format
      const transformedClub = {
        id: club.id,
        name: club.name,
        description: club.description,
        email: club.email,
        logo: club.logo || "/clubs/default.jpg",
        members: club.members || 0,
        status: club.status || "active",
        last_login: club.last_login ? new Date(club.last_login).toISOString() : null,
        created_at: club.created_at ? new Date(club.created_at).toISOString() : new Date().toISOString(),
      };
      
      return NextResponse.json(transformedClub);
    }
    
    // Fetch all clubs
    const clubs = await Club.find({}).lean();
    
    // Transform MongoDB documents to match expected format
    const transformedClubs = clubs.map(club => ({
      id: club.id,
      name: club.name,
      description: club.description,
      email: club.email,
      logo: club.logo || "/clubs/default.jpg",
      members: club.members || 0,
      status: club.status || "active",
      last_login: club.last_login ? new Date(club.last_login).toISOString() : null,
      created_at: club.created_at ? new Date(club.created_at).toISOString() : new Date().toISOString(),
    }));
    
    return NextResponse.json(transformedClubs);
  } catch (error) {
    console.error("Error in clubs API:", error);
    return NextResponse.json(mockClubs);
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingClub = await Club.findOne({ email: body.email });
    if (existingClub) {
      return NextResponse.json(
        { error: "A club with this email already exists" },
        { status: 400 }
      );
    }
    
    // Create new club with generated ID
    const newClub = new Club({
      id: randomUUID(),
      name: body.name,
      description: body.description || "",
      email: body.email,
      logo: body.logo || "/clubs/default.jpg",
      members: 0,
      status: body.status || "active",
      created_at: new Date(),
    });
    
    const savedClub = await newClub.save();
    
    // Transform to match expected format
    const transformedClub = {
      id: savedClub.id,
      name: savedClub.name,
      description: savedClub.description,
      email: savedClub.email,
      logo: savedClub.logo || "/clubs/default.jpg",
      members: savedClub.members || 0,
      status: savedClub.status || "active",
      last_login: savedClub.last_login ? new Date(savedClub.last_login).toISOString() : null,
      created_at: savedClub.created_at ? new Date(savedClub.created_at).toISOString() : new Date().toISOString(),
    };
    
    return NextResponse.json(transformedClub, { status: 201 });
  } catch (error: any) {
    console.error("Error in clubs API:", error);
    
    // Handle duplicate email error
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: "A club with this email already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create club" },
      { status: 500 }
    );
  }
} 