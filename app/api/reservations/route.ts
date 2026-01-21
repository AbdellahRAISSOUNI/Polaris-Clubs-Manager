import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Reservation } from "@/models/Reservation";
import { Club } from "@/models/Club";
import { Space } from "@/models/Space";
import { User } from "@/models/User";
import { sendNotification } from "@/lib/send-notification";
import { TimePeriod, type TimePeriodType } from "@/models/TimePeriod";
import { randomUUID } from "crypto";

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

// Mock data for initial setup - will be used if MongoDB connection fails
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
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const spaceId = searchParams.get('spaceId');
    const status = searchParams.get('status');
    const periodType = searchParams.get('periodType') as TimePeriodType | null;
    const periodId = searchParams.get('periodId');

    // Build MongoDB query
    const query: any = {};
    if (clubId) query.club_id = clubId;
    if (spaceId) query.space_id = spaceId;
    if (status) query.status = status;
    if (periodType && periodId) {
      if (!["mandate", "academicYear"].includes(periodType)) {
        return NextResponse.json({ error: "Invalid periodType" }, { status: 400 });
      }

      const period = await TimePeriod.findOne({ id: periodId, type: periodType })
        .select("start_date end_date")
        .lean();

      if (!period) {
        return NextResponse.json({ error: "Time period not found" }, { status: 404 });
      }

      query.start_time = {
        $gte: new Date(period.start_date),
        $lte: new Date(period.end_date),
      };
    }

    // Fetch reservations from MongoDB
    const reservationsData = await Reservation.find(query).lean();

    // Get all clubs to create a mapping
    const clubsData = await Club.find({}).select('id name').lean();
    const clubMap = new Map(clubsData.map(club => [club.id, club.name]));

    // Get all spaces to create a mapping
    const spacesData = await Space.find({}).select('id name').lean();
    const spaceMap = new Map(spacesData.map(space => [space.id, space.name]));

    // Transform the reservations data to include club names and space names
    const transformedData = reservationsData.map(reservation => ({
      id: reservation.id,
      space_id: reservation.space_id,
      club_id: reservation.club_id,
      title: reservation.title,
      description: reservation.description || '',
      start_time: reservation.start_time ? new Date(reservation.start_time).toISOString() : '',
      end_time: reservation.end_time ? new Date(reservation.end_time).toISOString() : '',
      status: reservation.status,
      is_full_day: reservation.is_full_day || false,
      admin_message: reservation.admin_message || '',
      created_at: reservation.created_at ? new Date(reservation.created_at).toISOString() : new Date().toISOString(),
      updated_at: reservation.updated_at ? new Date(reservation.updated_at).toISOString() : new Date().toISOString(),
      club_name: clubMap.get(reservation.club_id) || 'Unknown Club',
      space_name: spaceMap.get(reservation.space_id) || 'Unknown Space'
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
    
    // Validate that end_time is after start_time
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }
    
    await connectMongo();
    
    // Prepare the data for insertion
    const reservationData = {
      id: randomUUID(),
      space_id: body.spaceId,
      club_id: body.clubId,
      title: body.title,
      description: body.description || "",
      start_time: startTime,
      end_time: endTime,
      status: "pending" as const, // All new reservations start as pending
      is_full_day: body.isFullDay || false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    console.log("Inserting reservation data:", reservationData);
    
    // Create new reservation in MongoDB
    const newReservation = new Reservation(reservationData);
    const savedReservation = await newReservation.save();
    
    // Get club name for the notification
    const clubData = await Club.findOne({ id: body.clubId }).select('name').lean();
    const clubName = clubData?.name || 'A club';
    
    // Get space name for the notification
    const spaceData = await Space.findOne({ id: body.spaceId }).select('name').lean();
    const spaceName = spaceData?.name || 'a space';
    
    // Get all admin IDs to send notifications to
    const adminData = await User.find({ role: 'admin' }).select('id').lean();
    
    if (adminData.length > 0) {
      // Send notification to all admins
      for (const admin of adminData) {
        try {
          await sendNotification({
            recipientId: admin.id,
            recipientType: 'admin',
            title: 'New Reservation Request',
            message: `${clubName} has requested to reserve ${spaceName} for "${body.title}"`,
            type: 'info',
            link: `/admin/all-reservations?id=${savedReservation.id}`,
            sender_id: body.clubId
          });
        } catch (notifError) {
          console.error("Error sending notification to admin:", notifError);
        }
      }
    }
    
    // Send confirmation notification to the club
    try {
      await sendNotification({
        recipientId: body.clubId,
        recipientType: 'club',
        title: 'Reservation Submitted',
        message: `Your reservation request for "${body.title}" has been submitted and is pending approval.`,
        type: 'success',
        link: `/club/reservations`
      });
    } catch (notifError) {
      console.error("Error sending notification to club:", notifError);
    }
    
    // Transform to match expected format
    const transformedReservation = {
      id: savedReservation.id,
      space_id: savedReservation.space_id,
      club_id: savedReservation.club_id,
      title: savedReservation.title,
      description: savedReservation.description || '',
      start_time: savedReservation.start_time ? new Date(savedReservation.start_time).toISOString() : '',
      end_time: savedReservation.end_time ? new Date(savedReservation.end_time).toISOString() : '',
      status: savedReservation.status,
      is_full_day: savedReservation.is_full_day || false,
      admin_message: savedReservation.admin_message || '',
      created_at: savedReservation.created_at ? new Date(savedReservation.created_at).toISOString() : new Date().toISOString(),
      updated_at: savedReservation.updated_at ? new Date(savedReservation.updated_at).toISOString() : new Date().toISOString(),
    };
    
    return NextResponse.json(transformedReservation, { status: 201 });
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