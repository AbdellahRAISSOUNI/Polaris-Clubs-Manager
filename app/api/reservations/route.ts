import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Mock data for initial setup - will be used if Supabase connection fails
const mockReservations = [
  {
    id: "1",
    space_id: "1",
    club_id: "1",
    title: "Weekly Meeting",
    description: "Regular club meeting",
    start_time: "2024-03-20T14:00:00Z",
    end_time: "2024-03-20T16:00:00Z",
    status: "approved",
    club_name: "Computer Science Club"
  },
  {
    id: "2",
    space_id: "2",
    club_id: "1",
    title: "Workshop Series",
    description: "Weekly workshop for members",
    start_time: "2023-11-20T10:00:00Z",
    end_time: "2023-11-20T12:00:00Z",
    status: "pending",
  },
  {
    id: "3",
    space_id: "3",
    club_id: "1",
    title: "Executive Board Meeting",
    description: "Monthly meeting for club leadership",
    start_time: "2023-11-25T15:00:00Z",
    end_time: "2023-11-25T16:30:00Z",
    status: "approved",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const spaceId = searchParams.get('spaceId');
    const status = searchParams.get('status');

    // First, get all reservations
    let query = supabase
      .from('reservations')
      .select('*');

    // Apply filters if provided
    if (clubId) {
      query = query.eq('club_id', clubId);
    }
    if (spaceId) {
      query = query.eq('space_id', spaceId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: reservationsData, error: reservationsError } = await query;

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      return NextResponse.json(mockReservations);
    }

    // Get all clubs to create a mapping
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name');

    if (clubsError) {
      console.error("Error fetching clubs:", clubsError);
      return NextResponse.json(mockReservations);
    }

    // Create a map of club IDs to club names
    const clubMap = new Map(clubsData.map(club => [club.id, club.name]));

    // Transform the reservations data to include club names
    const transformedData = reservationsData.map(reservation => ({
      ...reservation,
      club_name: clubMap.get(reservation.club_id) || 'Unknown Club'
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error in reservations API:", error);
    return NextResponse.json(mockReservations);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log the request body for debugging
    console.log("Reservation request body:", body);
    
    // Validate required fields
    if (!body.spaceId || !body.clubId || !body.title || !body.startTime || !body.endTime) {
      console.log("Missing required fields:", { 
        spaceId: !!body.spaceId, 
        clubId: !!body.clubId, 
        title: !!body.title, 
        startTime: !!body.startTime, 
        endTime: !!body.endTime 
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Prepare the data for insertion
    const reservationData = {
      space_id: body.spaceId,
      club_id: body.clubId,
      title: body.title,
      description: body.description || "",
      start_time: body.startTime,
      end_time: body.endTime,
      status: "pending", // All new reservations start as pending
      is_full_day: body.isFullDay || false, // Store whether this is a full day reservation
    };
    
    console.log("Inserting reservation data:", reservationData);
    
    // Try inserting without the .single() method first
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select();
    
    if (error) {
      // Log the detailed error from Supabase
      console.error("Supabase error creating reservation:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // If there's an error, use mock data as a fallback
      console.log("Using mock data as fallback");
      
      // Generate a unique ID for the mock reservation
      const mockId = Date.now().toString();
      
      // Create a mock reservation with the same data structure as the database
      const mockReservation = {
        id: mockId,
        ...reservationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add the mock reservation to the mockReservations array so it appears in GET requests
      mockReservations.push(mockReservation);
      
      return NextResponse.json(mockReservation, { status: 201 });
    }
    
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    // Log the detailed error
    console.error("Unexpected error in reservations API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create reservation: ${errorMessage}` },
      { status: 500 }
    );
  }
} 