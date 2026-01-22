"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, Users, Building, CheckCircle2, Clock3, AlertCircle, X, TableIcon, CalendarIcon, Search, ArrowUpDown, Filter, Eye, FileDown, Trash2, SlidersHorizontal } from "lucide-react"
import { BigCalendar } from "@/components/big-calendar"
import { Badge } from "@/components/ui/badge"
import { format, formatDistance, parseISO, eachMonthOfInterval, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { AdminLayout } from "@/components/admin-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReservationDetails } from "@/components/reservation-details"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf, Image } from '@react-pdf/renderer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { getCurrentPeriod, getPreviousPeriod, type TimePeriod } from "@/lib/time-periods-client"
import { Pagination } from "@/components/ui/pagination"

interface Reservation {
  id: string;
  space_id: string;
  club_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  club_name?: string;
  space_name?: string;
  is_full_day?: boolean;
}

type SortField = 'date' | 'club' | 'title' | 'time' | 'status' | 'created_at' | 'location';
type SortDirection = 'asc' | 'desc';

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FF6B00',
    paddingBottom: 10,
  },
  logo: {
    width: 100,
    height: 50,
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B1464',
  },
  monthContainer: {
    flexDirection: 'column',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  monthHeader: {
    backgroundColor: '#FF6B00',
    color: 'white',
    padding: 5,
    textAlign: 'center',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  weekdayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1B1464',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 2,
  },
  dayCell: {
    width: '14.28%',
    borderRight: 1,
    borderBottom: 1,
    borderColor: '#E0E0E0',
    padding: 2,
    minHeight: 60,
  },
  dayNumber: {
    fontSize: 8,
    textAlign: 'right',
    marginRight: 2,
    marginBottom: 2,
  },
  eventContainer: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: 2,
    padding: 2,
    marginTop: 2,
  },
  eventText: {
    fontSize: 5,
    color: '#1B1464',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#888',
  },
  approvedEvent: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  pendingEvent: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  rejectedEvent: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});

// PDF Calendar Component
const CalendarPDF = ({ reservations, year }: { reservations: Reservation[], year: number }) => {
  // Prepare reservations by month
  const yearReservations = reservations.filter(res => 
    new Date(res.start_time).getFullYear() === year
  );

  // Helper function to get event background color based on status
  const getEventStyle = (status: string) => {
    switch(status) {
      case 'approved':
        return styles.approvedEvent;
      case 'pending':
        return styles.pendingEvent;
      case 'rejected':
        return styles.rejectedEvent;
      default:
        return styles.eventContainer;
    }
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/public/images/ade-logo.svg" style={styles.logo} />
          <Text style={styles.headerTitle}>ADE ENSA Tetouan - Annual Reservations Calendar {year}</Text>
        </View>

        {/* Months */}
        {eachMonthOfInterval({ 
          start: startOfYear(new Date(year, 0, 1)), 
          end: endOfYear(new Date(year, 0, 1)) 
        }).map((monthDate) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
          const firstDayOfMonth = daysInMonth[0].getDay(); // 0 = Sunday, 1 = Monday, etc.

          // Create array for empty cells before the first day
          const emptyDays = Array(firstDayOfMonth).fill(null);

          return (
            <View key={format(monthDate, 'MMMM')} style={styles.monthContainer}>
              <Text style={styles.monthHeader}>
                {format(monthDate, 'MMMM yyyy')}
              </Text>
              <View style={styles.calendarGrid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <Text key={index} style={styles.weekdayHeader}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {/* Empty cells for days before the first of the month */}
                {emptyDays.map((_, index) => (
                  <View key={`empty-${index}`} style={styles.dayCell}>
                    <Text style={styles.dayNumber}></Text>
                  </View>
                ))}
                {/* Actual days of the month */}
                {daysInMonth.map((day) => {
                  const dayReservations = yearReservations.filter(res => 
                    isSameDay(parseISO(res.start_time), day)
                  );

                  return (
                    <View key={format(day, 'dd-MM-yyyy')} style={styles.dayCell}>
                      <Text style={styles.dayNumber}>{format(day, 'd')}</Text>
                      {dayReservations.map((res, index) => (
                        <View key={index} style={[styles.eventContainer, getEventStyle(res.status)]}>
                          <Text style={styles.eventText}>
                            {res.club_name}: {res.title}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {format(new Date(), 'dd MMMM yyyy')} | ADE ENSA Tetouan
        </Text>
      </Page>
    </Document>
  );
};

// Main page component
export default function AllReservationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <AllReservationsContent />
    </Suspense>
  );
}

// Content component that uses useSearchParams
function AllReservationsContent() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [reservationStatus, setReservationStatus] = useState<string>("")
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodScope, setPeriodScope] = useState<"all" | "mandate" | "academicYear">("mandate")
  const [periodMode, setPeriodMode] = useState<"current" | "previous" | "specific">("current")
  const [specificPeriodId, setSpecificPeriodId] = useState<string>("")
  const [mandates, setMandates] = useState<TimePeriod[]>([])
  const [academicYears, setAcademicYears] = useState<TimePeriod[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [clubFilter, setClubFilter] = useState<string[]>([])
  const [uniqueClubs, setUniqueClubs] = useState<{id: string, name: string}[]>([])
  const [highlightedReservationId, setHighlightedReservationId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set())
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // Get URL parameters
  const searchParams = useSearchParams()
  const reservationIdFromUrl = searchParams.get('reservationId')

  const activePeriods = periodScope === "mandate" ? mandates : academicYears
  const currentPeriod = periodScope === "all" ? null : getCurrentPeriod(activePeriods)
  const previousPeriod = periodScope === "all" ? null : getPreviousPeriod(activePeriods, currentPeriod)
  const activePeriodId =
    periodScope === "all"
      ? null
      : periodMode === "current"
        ? currentPeriod?.id || null
        : periodMode === "previous"
          ? previousPeriod?.id || null
          : specificPeriodId || null
  const activePeriodType = periodScope === "all" ? null : periodScope

  // Fetch time periods on mount (default = current mandate)
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const [mandatesRes, yearsRes] = await Promise.all([
          fetch("/api/time-periods?type=mandate"),
          fetch("/api/time-periods?type=academicYear"),
        ])
        const mandatesData = mandatesRes.ok ? await mandatesRes.json() : []
        const yearsData = yearsRes.ok ? await yearsRes.json() : []
        setMandates(mandatesData || [])
        setAcademicYears(yearsData || [])

        const currentMandate = getCurrentPeriod(mandatesData || [])
        setPeriodScope("mandate")
        setPeriodMode("current")
        setSpecificPeriodId(currentMandate?.id || "")
      } catch (e) {
        console.error("Error fetching time periods:", e)
      }
    }
    fetchPeriods()
  }, [])

  // Fetch reservations function (extracted to be reusable)
  const fetchReservations = useCallback(async (skipUrlCheck = false) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activePeriodType && activePeriodId) {
        params.set("periodType", activePeriodType)
        params.set("periodId", activePeriodId)
      }
      const url = params.toString() ? `/api/reservations?${params.toString()}` : "/api/reservations"

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch reservations')
      }
      const data = await response.json()
      setReservations(data)
      setError(null)
      
      // Extract unique clubs for filtering
      const clubs = Array.from(new Set(data.map((r: Reservation) => r.club_id)))
        .map(clubId => {
          const reservation = data.find((r: Reservation) => r.club_id === clubId);
          return {
            id: clubId as string,
            name: reservation?.club_name || 'Unknown Club'
          };
        });
      setUniqueClubs(clubs);
      
      // If there's a reservation ID in the URL, highlight it and open its details
      if (!skipUrlCheck && reservationIdFromUrl) {
        setHighlightedReservationId(reservationIdFromUrl)
        const reservation = data.find((r: Reservation) => r.id === reservationIdFromUrl)
        if (reservation) {
          // Format and set selected reservation
          const formattedReservation = {
            id: reservation.id,
            title: reservation.title,
            status: reservation.status,
            date: new Date(reservation.start_time),
            time: reservation.is_full_day 
              ? "Full Day" 
              : `${format(new Date(reservation.start_time), "h:mm a")} - ${format(new Date(reservation.end_time), "h:mm a")}`,
            clubName: reservation.club_name || "Unknown Club",
            clubLogo: `/api/clubs/${reservation.club_id}/image`,
            isFullDay: reservation.is_full_day,
            location: reservation.space_name
          };
          setSelectedReservation(reservation);
          setReservationStatus(reservation.status);
          setIsDetailsOpen(true);
          // Set view mode to calendar to ensure the reservation is visible
          setViewMode("calendar")
        }
      }
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reservations')
    } finally {
      setIsLoading(false)
    }
  }, [activePeriodType, activePeriodId, reservationIdFromUrl, setViewMode, setHighlightedReservationId, setUniqueClubs, setSelectedReservation, setReservationStatus, setIsDetailsOpen])

  // Fetch reservations when filter changes
  useEffect(() => {
    if (periodScope !== "all" && !activePeriodId) {
      setReservations([])
      setIsLoading(false)
      return
    }

    fetchReservations()
  }, [fetchReservations, periodScope, periodMode, specificPeriodId, mandates, academicYears])

  const handleReservationSelect = (reservation: Reservation) => {
    // Format the reservation data for the ReservationDetails component
    const formattedReservation = {
      id: reservation.id,
      title: reservation.title,
      status: reservation.status,
      date: new Date(reservation.start_time),
      time: reservation.is_full_day 
        ? "Full Day" 
        : `${format(new Date(reservation.start_time), "h:mm a")} - ${format(new Date(reservation.end_time), "h:mm a")}`,
      clubName: reservation.club_name || "Unknown Club",
      clubLogo: `/api/clubs/${reservation.club_id}/image`,
      isFullDay: reservation.is_full_day,
      location: reservation.space_name
    };
    
    setSelectedReservation(reservation);
    setReservationStatus(reservation.status);
    setIsDetailsOpen(true);
  }

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a")
  }

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
          icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
          label: 'Approved',
          description: 'This reservation has been approved and is confirmed.'
        }
      case 'pending':
        return {
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
          icon: <Clock3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
          label: 'Pending',
          description: 'This reservation is awaiting approval from administrators.'
        }
      case 'rejected':
        return {
          color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
          icon: <X className="h-5 w-5 text-red-600 dark:text-red-400" />,
          label: 'Rejected',
          description: 'This reservation has been rejected by administrators.'
        }
      default:
        return {
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
          icon: <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          description: `This reservation is currently ${status.toLowerCase()}.`
        }
    }
  }

  const getDuration = (start: string, end: string, isFullDay?: boolean) => {
    if (isFullDay) return "Full Day"
    
    const startDate = new Date(start)
    const endDate = new Date(end)
    return formatDistance(startDate, endDate)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedReservation) return
    
    setReservationStatus(newStatus)
    
    try {
      const response = await fetch(`/api/reservations/${selectedReservation.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      // Update local state
      const updatedReservations = reservations.map(r => 
        r.id === selectedReservation.id ? { ...r, status: newStatus } : r
      );
      setReservations(updatedReservations);
      setSelectedReservation({ ...selectedReservation, status: newStatus });
      
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  }

  const updateReservationStatus = async (reservationId: string, newStatus: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update status")

      // Auto-refresh reservations to get latest data
      await fetchReservations(true)
      setSelectedReservation((prev) => (prev && prev.id === reservationId ? { ...prev, status: newStatus } : prev))
    } catch (error) {
      console.error("Error updating reservation:", error)
      setError("Failed to update reservation status. Please try again.")
    }
  }

  // Bulk action handlers
  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete' | 'status', status?: string, message?: string) => {
    if (selectedReservations.size === 0) return

    setIsBulkActionLoading(true)
    try {
      const response = await fetch('/api/reservations/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationIds: Array.from(selectedReservations),
          action: action === 'status' ? 'status' : action,
          status: status,
          message: message,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform bulk action')
      }

      const result = await response.json()
      
      // Show success notification
      const { successNotification } = await import('@/lib/notifications')
      successNotification({
        title: "Bulk Action Successful",
        description: result.message || `Successfully processed ${selectedReservations.size} reservation(s)`
      })

      // Clear selection and refresh
      setSelectedReservations(new Set())
      await fetchReservations(true)
    } catch (error: any) {
      console.error('Error performing bulk action:', error)
      const { errorNotification } = await import('@/lib/notifications')
      errorNotification({
        title: "Bulk Action Failed",
        description: error.message || 'Failed to perform bulk action'
      })
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const toggleReservationSelection = (reservationId: string) => {
    setSelectedReservations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reservationId)) {
        newSet.delete(reservationId)
      } else {
        newSet.add(reservationId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedReservations.size === filteredAndSortedReservations.length) {
      setSelectedReservations(new Set())
    } else {
      setSelectedReservations(new Set(filteredAndSortedReservations.map(r => r.id)))
    }
  }

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort reservations
  const filteredAndSortedReservations = reservations
    .filter(reservation => {
      // Apply search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        reservation.title.toLowerCase().includes(searchLower) ||
        (reservation.club_name || '').toLowerCase().includes(searchLower) ||
        (reservation.space_name || '').toLowerCase().includes(searchLower) ||
        reservation.status.toLowerCase().includes(searchLower);
      
      // Apply status filter
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(reservation.status);
      
      // Apply club filter
      const matchesClub = clubFilter.length === 0 || clubFilter.includes(reservation.club_id);
      
      return matchesSearch && matchesStatus && matchesClub;
    })
    .sort((a, b) => {
      // Apply sorting
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'date':
          return direction * (new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        case 'club':
          return direction * ((a.club_name || '').localeCompare(b.club_name || ''));
        case 'location':
          return direction * ((a.space_name || '').localeCompare(b.space_name || ''));
        case 'title':
          return direction * (a.title.localeCompare(b.title));
        case 'time':
          return direction * (new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        case 'status':
          return direction * (a.status.localeCompare(b.status));
        case 'created_at':
          return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedReservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReservations = filteredAndSortedReservations.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, clubFilter, sortField, sortDirection])

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ArrowUpDown className="ml-2 h-4 w-4 text-blue-500" /> 
      : <ArrowUpDown className="ml-2 h-4 w-4 text-blue-500 rotate-180" />;
  };

  const handleExportCalendar = async () => {
    try {
      const blob = await pdf(<CalendarPDF reservations={reservations} year={new Date().getFullYear()} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ADE-Calendar-${new Date().getFullYear()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">All Clubs Calendar</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage reservations from all clubs across the campus
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-0 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                const params = new URLSearchParams();
                if (activePeriodType && activePeriodId) {
                  params.set('periodType', activePeriodType);
                  params.set('periodId', activePeriodId);
                }
                const url = params.toString() ? `/api/reservations?${params.toString()}` : '/api/reservations';
                fetch(url)
                  .then(response => response.json())
                  .then(data => {
                    setReservations(data);
                    setError(null);
                  })
                  .catch(err => {
                    console.error('Error fetching reservations:', err);
                    setError(err instanceof Error ? err.message : 'Failed to load reservations');
                  })
                  .finally(() => setIsLoading(false));
              }}
              className="flex items-center gap-1 sm:gap-2 text-xs h-8 sm:h-9 flex-1 md:flex-auto justify-center"
            >
              {isLoading ? (
                <>
                  <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 sm:h-4 sm:w-4"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  Refresh
                </>
              )}
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="flex items-center gap-1 sm:gap-2 text-xs h-8 sm:h-9 flex-1 md:flex-auto justify-center"
            >
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center gap-1 sm:gap-2 text-xs h-8 sm:h-9 flex-1 md:flex-auto justify-center"
            >
              <TableIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              Table
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCalendar}
              className="h-8 sm:h-9 w-8 sm:w-9 p-0"
              title="Export Annual Calendar"
            >
              <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 sm:h-9 flex items-center gap-1 sm:gap-2 text-xs border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              title="Time Period Filters"
            >
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Period</span>
            </Button>
          </div>
        </div>

        {/* Time period filter - Collapsible */}
        {showFilters && (
          <div className="rounded-lg border bg-white dark:bg-gray-950 p-2 sm:p-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <Label className="text-xs">Scope</Label>
              <Select
                value={periodScope}
                onValueChange={(value) => {
                  const nextScope = value as "all" | "mandate" | "academicYear"
                  setPeriodScope(nextScope)
                  setPeriodMode(nextScope === "all" ? "current" : "current")
                  if (nextScope === "mandate") {
                    setSpecificPeriodId(getCurrentPeriod(mandates)?.id || mandates?.[0]?.id || "")
                  } else if (nextScope === "academicYear") {
                    setSpecificPeriodId(getCurrentPeriod(academicYears)?.id || academicYears?.[0]?.id || "")
                  } else {
                    setSpecificPeriodId("")
                  }
                }}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandate">Mandat ADE</SelectItem>
                  <SelectItem value="academicYear">Année scolaire</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodScope !== "all" ? (
              <>
                <div>
                  <Label className="text-xs">Period</Label>
                  <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as any)}>
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="previous">Previous</SelectItem>
                      <SelectItem value="specific">Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{periodScope === "mandate" ? "Mandat" : "Année scolaire"}</Label>
                  <Select
                    value={periodMode === "specific" ? specificPeriodId : activePeriodId || ""}
                    onValueChange={(v) => {
                      setPeriodMode("specific")
                      setSpecificPeriodId(v)
                    }}
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(periodScope === "mandate" ? mandates : academicYears).map((p) => {
                        const start = new Date(p.start_date)
                        const end = new Date(p.end_date)
                        const label = `${p.name} (${start.toLocaleDateString()} → ${end.toLocaleDateString()})`
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 flex items-end">
                <p className="text-xs text-muted-foreground">Showing all reservations</p>
              </div>
            )}
          </div>
        </div>
        )}

        {viewMode === "calendar" ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-md border overflow-hidden">
              <BigCalendar 
                onReservationSelect={handleReservationSelect} 
                highlightedReservationId={highlightedReservationId}
                periodType={activePeriodType || undefined}
                periodId={activePeriodId || undefined}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500"></div>
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500"></div>
                <span>Rejected</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
                  className="pl-7 sm:pl-8 text-xs sm:text-sm h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 sm:gap-2 text-xs h-8 sm:h-9 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                    >
                      <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                      <span className="hidden sm:inline">Table Filters</span>
                      <span className="sm:hidden">Filters</span>
                      {(statusFilter.length > 0 || clubFilter.length > 0) && (
                        <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px] sm:text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          {statusFilter.length + clubFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] sm:w-80 p-3 sm:p-4">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <h4 className="text-sm sm:text-base font-medium">Status</h4>
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          {['approved', 'pending', 'rejected'].map(status => (
                            <div key={status} className="flex items-center space-x-1.5 sm:space-x-2">
                              <Checkbox 
                                id={`status-${status}`} 
                                checked={statusFilter.includes(status)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setStatusFilter([...statusFilter, status]);
                                  } else {
                                    setStatusFilter(statusFilter.filter(s => s !== status));
                                  }
                                }}
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              />
                              <Label htmlFor={`status-${status}`} className="capitalize text-xs sm:text-sm">
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-1.5 sm:space-y-2">
                        <h4 className="text-sm sm:text-base font-medium">Clubs</h4>
                        <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto space-y-1.5 sm:space-y-2">
                          {uniqueClubs.map(club => (
                            <div key={club.id} className="flex items-center space-x-1.5 sm:space-x-2">
                              <Checkbox 
                                id={`club-${club.id}`} 
                                checked={clubFilter.includes(club.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setClubFilter([...clubFilter, club.id]);
                                  } else {
                                    setClubFilter(clubFilter.filter(id => id !== club.id));
                                  }
                                }}
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              />
                              <Label htmlFor={`club-${club.id}`} className="text-xs sm:text-sm">
                                {club.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between pt-1 sm:pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setStatusFilter([]);
                            setClubFilter([]);
                          }}
                          className="text-xs h-7 sm:h-8"
                        >
                          Reset
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => document.body.click()} // Close popover
                          className="text-xs h-7 sm:h-8"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedReservations.size > 0 && (
              <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {selectedReservations.size} selected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReservations(new Set())}
                    className="h-7 sm:h-8 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    disabled={isBulkActionLoading}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    {isBulkActionLoading ? (
                      <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-600" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('reject')}
                    disabled={isBulkActionLoading}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    {isBulkActionLoading ? (
                      <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                    ) : (
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-red-600" />
                    )}
                    Reject
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={isBulkActionLoading}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    {isBulkActionLoading ? (
                      <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                    ) : (
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-md border overflow-hidden">
              {isLoading ? (
                <div className="p-6 sm:p-8 text-center text-sm sm:text-base text-muted-foreground">
                  Loading reservations...
                </div>
              ) : error ? (
                <div className="p-6 sm:p-8 text-center text-sm sm:text-base text-red-500">
                  {error}
                </div>
              ) : filteredAndSortedReservations.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-sm sm:text-base text-muted-foreground">
                  No reservations found
                </div>
              ) : (
                <>
                  {/* Mobile: card list (no horizontal scrolling) */}
                  <div className="md:hidden divide-y">
                    {paginatedReservations.map((reservation: Reservation) => {
                      const startTime = new Date(reservation.start_time)
                      const endTime = new Date(reservation.end_time)
                      const isSelected = selectedReservations.has(reservation.id)
                      return (
                        <div
                          key={reservation.id}
                          className={`w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors flex items-start gap-3 ${isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleReservationSelection(reservation.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleReservationSelect(reservation)}
                            className="flex-1 text-left"
                          >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <img
                                src={`/api/clubs/${reservation.club_id}/image`}
                                alt={reservation.club_name || "Club logo"}
                                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement
                                  // Check if we're already trying placeholder or if it's the default-club-image
                                  if (target.src && 
                                      !target.src.includes('placeholder-logo.png') && 
                                      !target.src.includes('data:') &&
                                      !target.src.includes('default-club-image.png')) {
                                    // Only retry once with placeholder
                                    target.src = "/placeholder-logo.png"
                                  } else {
                                    // Hide to prevent infinite loops
                                    target.style.display = 'none'
                                  }
                                }}
                              />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{reservation.title}</div>
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                  {reservation.club_name || "Unknown Club"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{reservation.space_name || "Unknown Space"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span>{format(startTime, "MMM d, yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="whitespace-nowrap">
                                      {reservation.is_full_day
                                        ? "Full Day"
                                        : `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  reservation.status === "approved"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : reservation.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                              >
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              </Badge>

                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-3 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleReservationSelect(reservation)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Quick actions (larger touch targets) */}
                          <div className="mt-3 flex items-center gap-2">
                            {reservation.status !== "approved" && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 flex-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateReservationStatus(reservation.id, "approved")
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </Button>
                            )}
                            {reservation.status !== "rejected" && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 flex-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateReservationStatus(reservation.id, "rejected")
                                }}
                              >
                                <X className="h-4 w-4 mr-2 text-red-600" />
                                Reject
                              </Button>
                            )}
                          </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop/tablet: table */}
                  <div className="hidden md:block">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[3%] py-2 sm:py-3">
                            <Checkbox
                              checked={selectedReservations.size > 0 && selectedReservations.size === filteredAndSortedReservations.length}
                              onCheckedChange={toggleSelectAll}
                              className="ml-1"
                            />
                          </TableHead>
                          <TableHead
                            className="cursor-pointer text-xs sm:text-sm py-2 sm:py-3 w-[10%]"
                            onClick={() => handleSort('date')}
                          >
                            <div className="flex items-center">
                              Date
                              {getSortIcon('date')}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer text-xs sm:text-sm py-2 sm:py-3 w-[15%]"
                            onClick={() => handleSort('club')}
                          >
                            <div className="flex items-center">
                              Club
                              {getSortIcon('club')}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer text-xs sm:text-sm py-2 sm:py-3 w-[15%]"
                            onClick={() => handleSort('title')}
                          >
                            <div className="flex items-center">
                              Title
                              {getSortIcon('title')}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer text-xs sm:text-sm py-2 sm:py-3 w-[15%]"
                            onClick={() => handleSort('location')}
                          >
                            <div className="flex items-center">
                              Location
                              {getSortIcon('location')}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer text-xs sm:text-sm py-2 sm:py-3 w-[12%]"
                            onClick={() => handleSort('time')}
                          >
                            <div className="flex items-center">
                              Time
                              {getSortIcon('time')}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer text-xs sm:text-sm py-2 sm:py-3 w-[10%]"
                            onClick={() => handleSort('created_at')}
                          >
                            <div className="flex items-center">
                              Created
                              {getSortIcon('created_at')}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer text-xs sm:text-sm py-2 sm:py-3 w-[10%]"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center">
                              Status
                              {getSortIcon('status')}
                            </div>
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm py-2 sm:py-3 w-[13%]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReservations.map((reservation: Reservation) => {
                          const startTime = new Date(reservation.start_time)
                          const endTime = new Date(reservation.end_time)
                          const createdAt = new Date(reservation.created_at)
                          const isSelected = selectedReservations.has(reservation.id)
                          return (
                            <TableRow
                              key={reservation.id}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800 text-xs sm:text-sm ${isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                            >
                              <TableCell className="py-2 sm:py-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleReservationSelection(reservation.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </TableCell>
                              <TableCell className="py-2 sm:py-3">
                                {format(startTime, "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="py-2 sm:py-3">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <img
                                    src={`/api/clubs/${reservation.club_id}/image`}
                                    alt={reservation.club_name || 'Club logo'}
                                    className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover flex-shrink-0"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement
                                      // Check if we're already trying placeholder or if it's the default-club-image
                                      if (target.src && 
                                          !target.src.includes('placeholder-logo.png') && 
                                          !target.src.includes('data:') &&
                                          !target.src.includes('default-club-image.png')) {
                                        // Only retry once with placeholder
                                        target.src = '/placeholder-logo.png'
                                      } else {
                                        // Hide to prevent infinite loops
                                        target.style.display = 'none'
                                      }
                                    }}
                                  />
                                  <span className="truncate max-w-[80px] sm:max-w-[120px] inline-block">
                                    {reservation.club_name || 'Unknown Club'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell
                                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 py-2 sm:py-3 truncate max-w-[80px] sm:max-w-[150px]"
                                onClick={() => handleReservationSelect(reservation)}
                              >
                                <div className="truncate max-w-[100%]">
                                  {reservation.title}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 sm:py-3">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate max-w-[80px] sm:max-w-[120px] inline-block">
                                    {reservation.space_name || 'Unknown Space'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 sm:py-3">
                                {reservation.is_full_day ? (
                                  <Badge variant="outline" className="text-[10px] sm:text-xs">Full Day</Badge>
                                ) : (
                                  <span className="text-xs sm:text-sm whitespace-nowrap">
                                    {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-2 sm:py-3 whitespace-nowrap">
                                {format(createdAt, "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="py-2 sm:py-3">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] sm:text-xs ${
                                    reservation.status === "approved"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : reservation.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  }`}
                                >
                                  {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 sm:py-3">
                                <div className="flex flex-nowrap items-center gap-1 sm:gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReservationSelect(reservation);
                                    }}
                                  >
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                  {reservation.status !== 'approved' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateReservationStatus(reservation.id, "approved")
                                      }}
                                    >
                                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  )}
                                  {reservation.status !== 'rejected' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        updateReservationStatus(reservation.id, "rejected")
                                      }}
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4 px-2">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredAndSortedReservations.length}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {isDetailsOpen && selectedReservation && (
          <ReservationDetails
            reservation={{
              id: selectedReservation.id,
              title: selectedReservation.title,
              status: selectedReservation.status,
              date: new Date(selectedReservation.start_time),
              time: selectedReservation.is_full_day 
                ? "Full Day" 
                : `${format(new Date(selectedReservation.start_time), "h:mm a")} - ${format(new Date(selectedReservation.end_time), "h:mm a")}`,
              clubName: selectedReservation.club_name || "Unknown Club",
              clubLogo: `/api/clubs/${selectedReservation.club_id}/image`,
              isFullDay: selectedReservation.is_full_day,
              location: selectedReservation.space_name
            }}
            onClose={() => setIsDetailsOpen(false)}
            onStatusChange={async (newStatus) => {
              // Auto-refresh reservations after status change
              await fetchReservations(true)
            }}
          />
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedReservations.size} Reservation(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedReservations.size} reservation(s)? This action cannot be undone.
                All selected reservations will be permanently removed from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBulkActionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleBulkAction('delete')}
                disabled={isBulkActionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isBulkActionLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete All'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}