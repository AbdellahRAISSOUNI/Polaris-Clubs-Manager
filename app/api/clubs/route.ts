import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Mock data for initial setup - will be used if Supabase connection fails
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
      // Fetch a single club by ID
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error fetching club:", error);
        // Fall back to mock data if there's an error
        const club = mockClubs.find((club) => club.id === id);
        if (club) {
          return NextResponse.json(club);
        }
        return NextResponse.json({ error: "Club not found" }, { status: 404 });
      }
      
      return NextResponse.json(data);
    }
    
    // Fetch all clubs
    const { data, error } = await supabase
      .from('clubs')
      .select('*');
    
    if (error) {
      console.error("Error fetching clubs:", error);
      // Fall back to mock data if there's an error
      return NextResponse.json(mockClubs);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in clubs API:", error);
    return NextResponse.json(mockClubs);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: body.name,
        description: body.description || "",
        email: body.email,
        logo: body.logo || "/clubs/default.jpg",
        members: 0,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating club:", error);
      return NextResponse.json(
        { error: "Failed to create club" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in clubs API:", error);
    return NextResponse.json(
      { error: "Failed to create club" },
      { status: 500 }
    );
  }
} 