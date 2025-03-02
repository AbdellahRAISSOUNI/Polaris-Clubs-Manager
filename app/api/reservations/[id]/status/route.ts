import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mockReservations } from "../../route";

// Define the reservation type
interface Reservation {
  id: string;
  spaceId: string;
  clubId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;
    
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Update in Supabase
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating reservation status:", error);
      
      // Fall back to mock data if Supabase fails
      const reservationIndex = mockReservations.findIndex(
        (reservation) => reservation.id === id
      );
      
      if (reservationIndex === -1) {
        return NextResponse.json(
          { error: "Reservation not found" },
          { status: 404 }
        );
      }
      
      // Update the reservation status in mock data
      mockReservations[reservationIndex] = {
        ...mockReservations[reservationIndex],
        status,
      };
      
      return NextResponse.json(mockReservations[reservationIndex]);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in reservation status API:", error);
    return NextResponse.json(
      { error: "Failed to update reservation status" },
      { status: 500 }
    );
  }
} 