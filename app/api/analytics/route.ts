import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Function to get total reservations count
async function getTotalReservations() {
  try {
    const { count, error } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching total reservations:", error);
    return 0;
  }
}

// Function to get reservations by status
async function getReservationsByStatus() {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('status');
    
    if (error) throw error;
    
    // Count occurrences of each status
    const statusCounts = {
      approved: 0,
      pending: 0,
      rejected: 0
    };
    
    if (data) {
      data.forEach((reservation: any) => {
        const status = reservation.status as keyof typeof statusCounts;
        if (status in statusCounts) {
          statusCounts[status]++;
        }
      });
    }
    
    return statusCounts;
  } catch (error) {
    console.error("Error fetching reservations by status:", error);
    return { approved: 0, pending: 0, rejected: 0 };
  }
}

// Function to get space utilization
async function getSpaceUtilization() {
  try {
    // First get all spaces
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, name, capacity');
    
    if (spacesError) throw spacesError;
    
    // For each space, count reservations
    const spaceUtilization = [];
    
    if (spaces) {
      for (const space of spaces) {
        const { count, error } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('space_id', space.id);
        
        if (error) throw error;
        
        // Calculate utilization percentage (mock calculation)
        // In a real scenario, you might calculate based on hours booked vs. available hours
        const utilization = count ? Math.min(Math.round((count / 50) * 100), 100) : 0;
        
        spaceUtilization.push({
          name: space.name,
          utilization,
          reservations: count || 0
        });
      }
    }
    
    // Sort by utilization (highest first)
    return spaceUtilization.sort((a, b) => b.utilization - a.utilization);
  } catch (error) {
    console.error("Error fetching space utilization:", error);
    return [];
  }
}

// Function to get club activity
async function getClubActivity() {
  try {
    // First get all clubs
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name, members');
    
    if (clubsError) throw clubsError;
    
    // For each club, count reservations
    const clubActivity = [];
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];
    
    if (clubs) {
      for (let i = 0; i < clubs.length; i++) {
        const club = clubs[i];
        const { count, error } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id);
        
        if (error) throw error;
        
        clubActivity.push({
          name: club.name,
          reservations: count || 0,
          members: club.members || 0,
          color: colors[i % colors.length]
        });
      }
    }
    
    // Sort by number of reservations (highest first)
    return clubActivity.sort((a, b) => b.reservations - a.reservations);
  } catch (error) {
    console.error("Error fetching club activity:", error);
    return [];
  }
}

// Function to get monthly statistics
async function getMonthlyStats() {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('start_time, status');
    
    if (error) throw error;
    
    const monthlyStats = [
      { month: "Jan", reservations: 0, approved: 0, rejected: 0 },
      { month: "Feb", reservations: 0, approved: 0, rejected: 0 },
      { month: "Mar", reservations: 0, approved: 0, rejected: 0 },
      { month: "Apr", reservations: 0, approved: 0, rejected: 0 },
      { month: "May", reservations: 0, approved: 0, rejected: 0 },
      { month: "Jun", reservations: 0, approved: 0, rejected: 0 },
      { month: "Jul", reservations: 0, approved: 0, rejected: 0 },
      { month: "Aug", reservations: 0, approved: 0, rejected: 0 },
      { month: "Sep", reservations: 0, approved: 0, rejected: 0 },
      { month: "Oct", reservations: 0, approved: 0, rejected: 0 },
      { month: "Nov", reservations: 0, approved: 0, rejected: 0 },
      { month: "Dec", reservations: 0, approved: 0, rejected: 0 },
    ];
    
    if (data) {
      data.forEach((reservation: any) => {
        const date = new Date(reservation.start_time);
        const month = date.getMonth(); // 0-11
        
        monthlyStats[month].reservations++;
        
        if (reservation.status === 'approved') {
          monthlyStats[month].approved++;
        } else if (reservation.status === 'rejected') {
          monthlyStats[month].rejected++;
        }
      });
    }
    
    // Return only the last 6 months for display
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - i + 12) % 12; // Handle wrapping around to previous year
      last6Months.unshift(monthlyStats[monthIndex]);
    }
    
    return last6Months;
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return [];
  }
}

// Function to get time slot popularity
async function getTimeSlotPopularity() {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('start_time');
    
    if (error) throw error;
    
    const timeSlots = [
      { time: "8:00-10:00", count: 0, percentage: 0 },
      { time: "10:00-12:00", count: 0, percentage: 0 },
      { time: "12:00-14:00", count: 0, percentage: 0 },
      { time: "14:00-16:00", count: 0, percentage: 0 },
      { time: "16:00-18:00", count: 0, percentage: 0 },
      { time: "18:00-20:00", count: 0, percentage: 0 },
    ];
    
    if (data) {
      data.forEach((reservation: any) => {
        const date = new Date(reservation.start_time);
        const hour = date.getHours();
        
        if (hour >= 8 && hour < 10) timeSlots[0].count++;
        else if (hour >= 10 && hour < 12) timeSlots[1].count++;
        else if (hour >= 12 && hour < 14) timeSlots[2].count++;
        else if (hour >= 14 && hour < 16) timeSlots[3].count++;
        else if (hour >= 16 && hour < 18) timeSlots[4].count++;
        else if (hour >= 18 && hour < 20) timeSlots[5].count++;
      });
      
      // Calculate percentages
      const totalCount = data.length;
      timeSlots.forEach(slot => {
        slot.percentage = totalCount > 0 ? Math.round((slot.count / totalCount) * 100) : 0;
      });
    }
    
    return timeSlots;
  } catch (error) {
    console.error("Error fetching time slot popularity:", error);
    return [];
  }
}

// Function to get day of week analysis
async function getDayOfWeekAnalysis() {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('start_time');
    
    if (error) throw error;
    
    const daysOfWeek = [
      { day: "Mon", count: 0, height: 0 },
      { day: "Tue", count: 0, height: 0 },
      { day: "Wed", count: 0, height: 0 },
      { day: "Thu", count: 0, height: 0 },
      { day: "Fri", count: 0, height: 0 },
      { day: "Sat", count: 0, height: 0 },
      { day: "Sun", count: 0, height: 0 },
    ];
    
    if (data) {
      data.forEach((reservation: any) => {
        const date = new Date(reservation.start_time);
        const day = date.getDay(); // 0-6, where 0 is Sunday
        const dayIndex = day === 0 ? 6 : day - 1; // Convert to Mon-Sun format
        
        daysOfWeek[dayIndex].count++;
      });
      
      // Calculate heights for visualization (max 90)
      const maxCount = Math.max(...daysOfWeek.map(day => day.count));
      daysOfWeek.forEach(day => {
        day.height = maxCount > 0 ? Math.round((day.count / maxCount) * 90) : 0;
      });
    }
    
    return daysOfWeek;
  } catch (error) {
    console.error("Error fetching day of week analysis:", error);
    return [];
  }
}

// Function to get active clubs count
async function getActiveClubsCount() {
  try {
    const { count, error } = await supabase
      .from('clubs')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching active clubs count:", error);
    return 0;
  }
}

// Function to get overall space utilization
async function getOverallSpaceUtilization() {
  try {
    const spaceUtilization = await getSpaceUtilization();
    
    if (spaceUtilization.length === 0) return 0;
    
    // Calculate average utilization
    const totalUtilization = spaceUtilization.reduce((sum, space) => sum + space.utilization, 0);
    return Math.round(totalUtilization / spaceUtilization.length);
  } catch (error) {
    console.error("Error calculating overall space utilization:", error);
    return 0;
  }
}

// Function to get peak hours
async function getPeakHours() {
  try {
    const timeSlots = await getTimeSlotPopularity();
    
    if (timeSlots.length === 0) return { time: "N/A", percentage: 0 };
    
    // Find the time slot with the highest count
    const peakSlot = timeSlots.reduce((peak, slot) => 
      slot.count > peak.count ? slot : peak, timeSlots[0]);
    
    return { time: peakSlot.time, percentage: peakSlot.percentage };
  } catch (error) {
    console.error("Error finding peak hours:", error);
    return { time: "N/A", percentage: 0 };
  }
}

// Make this a static export
export const dynamic = 'force-static';

export async function GET() {
  try {
    // Use a default time range
    const timeRange = "last30days";
    
    // Fetch all the analytics data
    const [
      totalReservations,
      reservationsByStatus,
      spaceUtilization,
      clubActivity,
      monthlyStats,
      timeSlotPopularity,
      dayOfWeekAnalysis,
      activeClubsCount,
      overallSpaceUtilization,
      peakHours
    ] = await Promise.all([
      getTotalReservations(),
      getReservationsByStatus(),
      getSpaceUtilization(),
      getClubActivity(),
      getMonthlyStats(),
      getTimeSlotPopularity(),
      getDayOfWeekAnalysis(),
      getActiveClubsCount(),
      getOverallSpaceUtilization(),
      getPeakHours()
    ]);
    
    // Compile all data into a single response
    const analyticsData = {
      summary: {
        totalReservations,
        activeClubsCount,
        spaceUtilization: overallSpaceUtilization,
        peakHours
      },
      details: {
        reservationsByStatus,
        spaceUtilization,
        clubActivity,
        monthlyStats,
        timeSlotPopularity,
        dayOfWeekAnalysis
      }
    };
    
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
} 