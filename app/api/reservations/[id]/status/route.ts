import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Reservation } from "@/models/Reservation";
import { User } from "@/models/User";
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
    
    await connectMongo();
    
    // Get the reservation before updating
    console.log('Fetching reservation from MongoDB...');
    const reservationData = await Reservation.findOne({ id }).lean();
    
    console.log('Fetched reservation:', reservationData);
    
    if (!reservationData) {
      console.error("Reservation not found");
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }
    
    // Prepare update data - update status and admin_message if provided
    const updateData: any = {
      status,
      updated_at: new Date(),
    };
    
    if (message) {
      updateData.admin_message = message;
    }
    
    console.log('Updating reservation with data:', updateData);
    
    // Update in MongoDB
    const updatedReservation = await Reservation.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    ).lean();
    
    console.log('Update result:', updatedReservation);
    
    if (!updatedReservation) {
      console.error("Failed to update reservation");
      return NextResponse.json(
        { error: "Failed to update reservation" },
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
      const admins = await User.find({ role: 'admin' }).select('id').lean();
      
      if (admins && admins.length > 0) {
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
    
    // Transform to match expected format
    const transformedReservation = {
      id: updatedReservation.id,
      space_id: updatedReservation.space_id,
      club_id: updatedReservation.club_id,
      title: updatedReservation.title,
      description: updatedReservation.description || '',
      start_time: updatedReservation.start_time ? new Date(updatedReservation.start_time).toISOString() : '',
      end_time: updatedReservation.end_time ? new Date(updatedReservation.end_time).toISOString() : '',
      status: updatedReservation.status,
      is_full_day: updatedReservation.is_full_day || false,
      admin_message: updatedReservation.admin_message || '',
      created_at: updatedReservation.created_at ? new Date(updatedReservation.created_at).toISOString() : new Date().toISOString(),
      updated_at: updatedReservation.updated_at ? new Date(updatedReservation.updated_at).toISOString() : new Date().toISOString(),
    };
    
    return NextResponse.json(transformedReservation);
    
  } catch (error) {
    console.error("Error in reservation status API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update reservation status" },
      { status: 500 }
    );
  }
} 