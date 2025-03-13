import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendNotification } from "@/lib/send-notification";

// Define mock reservations for fallback
const mockReservations: any[] = [];

// Define the reservation type
interface Reservation {
  id: string;
  space_id: string;
  club_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  // No message field since it doesn't exist in the database
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Status update endpoint called with params:', params);
  console.log('Request URL:', request.url);
  
  try {
    const { id } = params;
    console.log('Processing reservation ID:', id);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { status, message } = body; // We'll still extract message for notifications
    console.log('Status:', status, 'Message:', message);
    
    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      console.log('Invalid status:', status);
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Get the reservation before updating
    console.log('Fetching reservation from Supabase...');
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('Fetched reservation:', reservationData);
    console.log('Fetch error:', reservationError);
    
    if (reservationError || !reservationData) {
      console.error("Error fetching reservation:", reservationError);
      return NextResponse.json(
        { error: reservationError?.message || "Reservation not found" },
        { status: 404 }
      );
    }
    
    // Prepare update data - ONLY update the status field
    const updateData = {
      status,
      // Removed updated_at field in case it doesn't exist
    };
    
    console.log('Updating reservation with data:', updateData);
    
    // Update in Supabase
    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    console.log('Update result:', data);
    console.log('Update error:', error);
    
    if (error) {
      console.error("Error updating reservation status:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update reservation" },
        { status: 500 }
      );
    }

    // Send notification to the club
    try {
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType: 'success' | 'error' | 'info' = 'info';
      
      if (status === 'approved') {
        notificationTitle = 'Reservation Approved';
        notificationMessage = `Your reservation for "${reservationData.title}" has been approved.`;
        if (message) {
          notificationMessage += `\n\nAdmin message: "${message}"`;
        }
        notificationType = 'success';
      } else if (status === 'rejected') {
        notificationTitle = 'Reservation Rejected';
        notificationMessage = `Your reservation for "${reservationData.title}" has been rejected.`;
        if (message) {
          notificationMessage += `\n\nReason: "${message}"`;
        }
        notificationType = 'error';
      }
      
      console.log('Sending notification:', {
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType
      });
      
      await sendNotification({
        recipientId: reservationData.club_id,
        recipientType: 'club',
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        link: `/club/all-reservations?id=${id}`
      });
    } catch (notifError) {
      console.error("Error sending notification to club:", notifError);
      // Don't fail the request if notification fails
    }
    
    // Send notification to admin as well
    try {
      // Get all admin IDs
      const { data: admins, error: adminsError } = await supabase
        .from('admins')
        .select('id');
      
      if (!adminsError && admins && admins.length > 0) {
        const notificationTitle = `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        const notificationMessage = `Reservation "${reservationData.title}" has been ${status}.`;
        
        // Send notification to each admin
        for (const admin of admins) {
          await sendNotification({
            recipientId: admin.id,
            recipientType: 'admin',
            title: notificationTitle,
            message: notificationMessage,
            type: 'info',
            link: `/admin/all-reservations?reservationId=${id}`,
            sender_id: reservationData.club_id
          });
        }
      }
    } catch (adminNotifError) {
      console.error("Error sending notification to admins:", adminNotifError);
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error in reservation status API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update reservation status" },
      { status: 500 }
    );
  }
} 