import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Mock data for initial setup - will be used if Supabase connection fails
export const mockReservations = [
  {
    id: "1",
    space_id: "1",
    club_id: "1",
    title: "Annual Club Meeting",
    description: "Yearly planning meeting for club activities",
    start_time: "2023-11-15T14:00:00Z",
    end_time: "2023-11-15T16:00:00Z",
    status: "approved",
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
    const clubId = searchParams.get("clubId");
    const spaceId = searchParams.get("spaceId");
    const status = searchParams.get("status");
    
    // Start building the query
    let query = supabase.from('reservations').select('*');
    
    // Add filters if provided
    if (clubId) {
      query = query.eq('club_id', clubId);
    }
    
    if (spaceId) {
      query = query.eq('space_id', spaceId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching reservations:", error);
      
      // Filter mock data if Supabase fails
      let filteredReservations = [...mockReservations];
      
      if (clubId) {
        filteredReservations = filteredReservations.filter(
          (reservation) => reservation.club_id === clubId
        );
      }
      
      if (spaceId) {
        filteredReservations = filteredReservations.filter(
          (reservation) => reservation.space_id === spaceId
        );
      }
      
      if (status) {
        filteredReservations = filteredReservations.filter(
          (reservation) => reservation.status === status
        );
      }
      
      return NextResponse.json(filteredReservations);
    }
    
    return NextResponse.json(data);
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