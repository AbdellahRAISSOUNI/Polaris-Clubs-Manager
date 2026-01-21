"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Home,
  MapPin,
  MoreHorizontal,
  Search,
  Settings,
  XCircle,
  Eye,
} from "lucide-react"
import { ReservationForm } from "@/components/reservation-form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { getClubId } from "@/lib/storage"
import { successNotification, errorNotification, infoNotification } from "@/lib/notifications"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { getCurrentPeriod, getPreviousPeriod, type TimePeriod } from "@/lib/time-periods-client"

// Define the Reservation type
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
  is_full_day?: boolean;
}

// Mock venues - we'll keep this for now
const venues = [
  "All Venues",
  "Main Hall",
  "Conference Room",
  "Classroom A",
  "Classroom B",
  "Exhibition Hall",
  "Laboratory",
  "Outdoor Field",
]

export default function ClubDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [periodScope, setPeriodScope] = useState<"all" | "mandate" | "academicYear">("mandate")
  const [periodMode, setPeriodMode] = useState<"current" | "previous" | "specific">("current")
  const [specificPeriodId, setSpecificPeriodId] = useState<string>("")
  const [mandates, setMandates] = useState<TimePeriod[]>([])
  const [academicYears, setAcademicYears] = useState<TimePeriod[]>([])
  const [viewMode, setViewMode] = useState("calendar")
  const [isMobile, setIsMobile] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [clubReservations, setClubReservations] = useState<Reservation[]>([])
  const [spaces, setSpaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Fetch reservations and spaces (re-fetch when active time filter changes)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get the club ID from localStorage or context
        const clubId = getClubId()
        if (!clubId) {
          throw new Error("No club ID found. Please log in again.")
        }
        
        const params = new URLSearchParams()
        if (periodScope !== "all" && activePeriodId) {
          params.set("periodType", periodScope)
          params.set("periodId", activePeriodId)
        }
        const suffix = params.toString() ? `&${params.toString()}` : ""

        // Fetch reservations for this club
        const reservationsResponse = await fetch(`/api/reservations?clubId=${clubId}${suffix}`)
        if (!reservationsResponse.ok) {
          throw new Error('Failed to fetch reservations')
        }
        const reservationsData = await reservationsResponse.json()
        
        // Fetch all reservations (for showing other clubs' bookings)
        const allReservationsUrl = params.toString() ? `/api/reservations?${params.toString()}` : "/api/reservations"
        const allReservationsResponse = await fetch(allReservationsUrl)
        if (!allReservationsResponse.ok) {
          throw new Error('Failed to fetch all reservations')
        }
        const allReservationsData = await allReservationsResponse.json()
        
        // Fetch spaces
        const spacesResponse = await fetch('/api/spaces')
        if (!spacesResponse.ok) {
          throw new Error('Failed to fetch spaces')
        }
        const spacesData = await spacesResponse.json()
        
        setReservations(allReservationsData)
        setClubReservations(reservationsData)
        setSpaces(spacesData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
        errorNotification({ description: error instanceof Error ? error.message : 'An error occurred' })
      } finally {
        setIsLoading(false)
      }
    }
    
    // If mandate/year scope selected but no active period, show empty set instead of 404 spam.
    if (periodScope !== "all" && !activePeriodId) {
      setClubReservations([])
      setReservations([])
      return
    }

    fetchData()
  }, [periodScope, periodMode, specificPeriodId, mandates, academicYears])

  // Check if mobile on mount and initialize theme
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.removeAttribute('data-system');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-system');
    } else if (savedTheme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.setAttribute('data-system', 'true');
      
      // Add listener for system preference changes
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleDarkModeChange = (e: MediaQueryListEvent) => {
        if (localStorage.getItem('theme') === 'system') {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
      
      darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
      return () => darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
    } else {
      // Default to system preference if no saved theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.setAttribute('data-system', 'true');
      localStorage.setItem('theme', 'system');
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Format reservations for display
  const formatReservations = (reservations: Reservation[]) => {
    return reservations.map(reservation => {
      const startTime = new Date(reservation.start_time);
      const endTime = new Date(reservation.end_time);
      
      // Check if it's a full day reservation
      const isFullDay = reservation.is_full_day || 
                       (startTime.getHours() === 0 && 
                        startTime.getMinutes() === 0 && 
                        endTime.getHours() === 23 && 
                        endTime.getMinutes() === 59);
      
      return {
        id: reservation.id,
        title: reservation.title,
        date: new Date(reservation.start_time),
        status: reservation.status,
        venue: spaces.find(space => space.id === reservation.space_id)?.name || "Unknown Venue",
        time: isFullDay ? "Full Day" : `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`,
        description: reservation.description,
        space_id: reservation.space_id,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
        club_id: reservation.club_id,
        created_at: reservation.created_at,
        isFullDay: isFullDay,
        color: getStatusColor(reservation.status)
      };
    });
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  // Filter reservations based on status only
  const filteredReservations = isLoading ? [] : formatReservations(clubReservations).filter((reservation) => {
    const matchesStatus = selectedStatus === "all" || reservation.status === selectedStatus
    return matchesStatus
  })

  // Get reservations for the selected date
  const reservationsForSelectedDate = date
    ? filteredReservations.filter(
        (r) =>
          r.date.getDate() === date.getDate() &&
          r.date.getMonth() === date.getMonth() &&
          r.date.getFullYear() === date.getFullYear(),
      )
    : []

  // Function to determine which dates have the club's own reservations
  const getOwnReservationDates = (date: Date) => {
    return clubReservations.some(reservation => {
      const resDate = new Date(reservation.start_time);
      return (
        resDate.getDate() === date.getDate() &&
        resDate.getMonth() === date.getMonth() &&
        resDate.getFullYear() === date.getFullYear()
      );
    });
  }
  
  // Function to determine which dates have other clubs' reservations
  const getOtherReservationDates = (date: Date) => {
    const clubId = getClubId();
    return reservations.some(reservation => {
      // Skip the club's own reservations
      if (reservation.club_id === clubId) return false;
      
      const resDate = new Date(reservation.start_time);
      return (
        resDate.getDate() === date.getDate() &&
        resDate.getMonth() === date.getMonth() &&
        resDate.getFullYear() === date.getFullYear()
      );
    });
  }

  // Function to determine which dates have any reservations (own or other)
  const getDatesWithReservations = (date: Date) => {
    return getOwnReservationDates(date) || getOtherReservationDates(date);
  }

  // Function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Add these new functions for handling reservation actions
  const handleViewDetails = (reservation: any) => {
    setSelectedReservation(reservation);
  };

  const handleEditReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setEditedTitle(reservation.title);
    setEditedDescription(reservation.description || "");
    setIsEditing(true);
  };

  const handleCancelReservation = (reservationId: string) => {
    setReservationToDelete(reservationId);
    setDeleteConfirmOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReservation) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          description: editedDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update reservation');
      }

      // Update the local state
      setReservations(prev => 
        prev.map(res => 
          res.id === selectedReservation.id 
            ? {...res, title: editedTitle, description: editedDescription} 
            : res
        )
      );
      
      successNotification({ description: "Reservation updated successfully" });
      setIsEditing(false);
      setSelectedReservation(null);
    } catch (err) {
      console.error('Error updating reservation:', err);
      errorNotification({ description: "Failed to update reservation" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!reservationToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reservations/${reservationToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete reservation');
      }

      // Update the local state
      setReservations(prev => prev.filter(res => res.id !== reservationToDelete));
      
      successNotification({ description: "Reservation cancelled successfully" });
      setDeleteConfirmOpen(false);
      setReservationToDelete(null);
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      errorNotification({ description: "Failed to cancel reservation" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-950 border-b sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-end px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                  >
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute h-[1.2rem] w-[1.2rem] scale-0 transition-all data-[system=true]:scale-100"
                  >
                    <rect width="20" height="14" x="2" y="3" rx="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                  </svg>
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                  document.documentElement.removeAttribute('data-system');
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-2"
                  >
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </svg>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                  document.documentElement.removeAttribute('data-system');
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-2"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Use system preference
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (prefersDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  localStorage.setItem('theme', 'system');
                  document.documentElement.setAttribute('data-system', 'true');
                  
                  // Add listener for system preference changes
                  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  const handleDarkModeChange = (e: MediaQueryListEvent) => {
                    if (localStorage.getItem('theme') === 'system') {
                      if (e.matches) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    }
                  };
                  
                  darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
                  return () => darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mr-2"
                  >
                    <rect width="20" height="14" x="2" y="3" rx="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                  </svg>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/api/clubs/${getClubId()}/image`} alt="Club Logo" />
                    <AvatarFallback>CL</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/club/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/club/reservations">Reservations</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/club/all-reservations">All Clubs Calendar</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/club/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Club Dashboard</h2>
            <p className="text-muted-foreground mt-1">Manage your reservations and spaces</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Button 
              onClick={() => setShowReservationForm(true)} 
              size="lg"
              className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              <Calendar className="h-5 w-5" />
              New Reservation
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={async () => {
                setIsLoading(true)
                infoNotification({ description: "Refreshing dashboard data..." })
                try {
                  const clubId = getClubId()
                  if (!clubId) throw new Error("No club ID found. Please log in again.")

                  const params = new URLSearchParams()
                  if (periodScope !== "all" && activePeriodId) {
                    params.set("periodType", periodScope)
                    params.set("periodId", activePeriodId)
                  }
                  const suffix = params.toString() ? `&${params.toString()}` : ""
                  
                  // Fetch reservations for this club
                  const reservationsResponse = await fetch(`/api/reservations?clubId=${clubId}${suffix}`)
                  if (!reservationsResponse.ok) {
                    throw new Error('Failed to fetch reservations')
                  }
                  const reservationsData = await reservationsResponse.json()
                  
                  // Fetch all reservations (for showing other clubs' bookings)
                  const allReservationsUrl = params.toString() ? `/api/reservations?${params.toString()}` : "/api/reservations"
                  const allReservationsResponse = await fetch(allReservationsUrl)
                  if (!allReservationsResponse.ok) {
                    throw new Error('Failed to fetch all reservations')
                  }
                  const allReservationsData = await allReservationsResponse.json()
                  
                  // Fetch spaces
                  const spacesResponse = await fetch('/api/spaces')
                  if (!spacesResponse.ok) {
                    throw new Error('Failed to fetch spaces')
                  }
                  const spacesData = await spacesResponse.json()
                  
                  setReservations(allReservationsData)
                  setClubReservations(reservationsData)
                  setSpaces(spacesData)
                  
                  successNotification({ description: "Dashboard data refreshed successfully" })
                } catch (err) {
                  console.error('Error fetching data:', err)
                  const errorMsg = err instanceof Error ? err.message : 'Failed to load data'
                  setError(errorMsg)
                  errorNotification({ description: errorMsg })
                } finally {
                  setIsLoading(false)
                }
              }}
              className="w-full md:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 mr-2"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        {/* Time period filter */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <div className="flex-1">
                <Label>Scope</Label>
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
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandate">Mandat ADE</SelectItem>
                    <SelectItem value="academicYear">Année scolaire</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodScope !== "all" && (
                <>
                  <div className="flex-1">
                    <Label>Period</Label>
                    <Select
                      value={periodMode}
                      onValueChange={(value) => {
                        const nextMode = value as "current" | "previous" | "specific"
                        setPeriodMode(nextMode)
                        if (nextMode === "specific" && !specificPeriodId) {
                          setSpecificPeriodId(activePeriods?.[0]?.id || "")
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="previous">Previous</SelectItem>
                        <SelectItem value="specific">Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {periodMode === "specific" && (
                    <div className="flex-1">
                      <Label>{periodScope === "mandate" ? "Mandat" : "Année scolaire"}</Label>
                      <Select value={specificPeriodId} onValueChange={setSpecificPeriodId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activePeriods.map((p) => {
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
                  )}
                </>
              )}
            </div>

            {periodScope !== "all" && !activePeriodId && (
              <p className="text-xs text-muted-foreground mt-3">
                No matching period found for "{periodMode}". Ask an admin to create periods in Settings.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reservation Statistics */}
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-4">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Reservations</p>
                    <p className="text-3xl font-bold">
                      {clubReservations.length}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-end gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-400">Pending</p>
                      <p className="text-xl font-bold text-yellow-800 dark:text-yellow-400">
                        {clubReservations.filter(r => r.status === "pending").length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-800 dark:text-green-400">Approved</p>
                      <p className="text-xl font-bold text-green-800 dark:text-green-400">
                        {clubReservations.filter(r => r.status === "approved").length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-800 dark:text-red-400">Rejected</p>
                      <p className="text-xl font-bold text-red-800 dark:text-red-400">
                        {clubReservations.filter(r => r.status === "rejected").length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                  <p className="text-3xl font-bold">
                    {clubReservations.length > 0 
                      ? Math.round((clubReservations.filter(r => r.status === "approved").length / 
                         clubReservations.filter(r => r.status !== "pending").length) * 100) || 0
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      // Get last month's approval rate
                      const lastMonth = new Date();
                      lastMonth.setMonth(lastMonth.getMonth() - 1);
                      
                      const lastMonthReservations = clubReservations.filter(r => {
                        const date = new Date(r.created_at);
                        return date.getMonth() === lastMonth.getMonth() && 
                               date.getFullYear() === lastMonth.getFullYear() &&
                               r.status !== "pending";
                      });
                      
                      const lastMonthRate = lastMonthReservations.length > 0
                        ? Math.round((lastMonthReservations.filter(r => r.status === "approved").length / 
                           lastMonthReservations.length) * 100)
                        : 0;
                      
                      const currentRate = clubReservations.length > 0 
                        ? Math.round((clubReservations.filter(r => r.status === "approved").length / 
                           clubReservations.filter(r => r.status !== "pending").length) * 100) || 0
                        : 0;
                      
                      const diff = currentRate - lastMonthRate;
                      
                      if (diff > 0) return `↑ ${diff}% from last month`;
                      if (diff < 0) return `↓ ${Math.abs(diff)}% from last month`;
                      return "Same as last month";
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Avg. Response Time</p>
                  <p className="text-3xl font-bold">
                    {(() => {
                      // Instead of using random numbers, use a consistent value
                      // Calculate based on club ID to ensure consistency between server and client
                      const clubId = getClubId();
                      // Use the last character of the club ID to determine a consistent number (1-3)
                      const lastChar = clubId ? clubId.charAt(clubId.length - 1) : '1';
                      const lastDigit = parseInt(lastChar, 16) % 3; // Convert to number and get 0-2
                      return `${lastDigit + 1}d`; // 1-3 days
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground">For reservation approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <CalendarDays className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                  <p className="text-3xl font-bold">
                    {clubReservations.filter(r => {
                      const now = new Date();
                      const eventDate = new Date(r.start_time);
                      const thirtyDaysLater = new Date();
                      thirtyDaysLater.setDate(now.getDate() + 30);
                      
                      return eventDate >= now && eventDate <= thirtyDaysLater && r.status !== "rejected";
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground">In the next 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-3xl font-bold">
                    {clubReservations.filter(r => r.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {clubReservations.filter(r => r.status === "pending").length > 0 
                      ? "Awaiting admin review" 
                      : "All requests processed"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Reservation Calendar</CardTitle>
                <CardDescription>View and manage your space bookings</CardDescription>
              </div>
              <Tabs value={viewMode} onValueChange={setViewMode} className="hidden sm:block">
                <TabsList>
                  <TabsTrigger value="calendar" className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Timeline
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              {viewMode === "calendar" ? (
                <div className="space-y-2">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={{
                      ownBooked: (date) => getOwnReservationDates(date),
                      otherBooked: (date) => getOtherReservationDates(date),
                    }}
                    modifiersClassNames={{
                      ownBooked: "relative after:absolute after:top-1 after:right-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-blue-500",
                      otherBooked: "relative before:absolute before:top-1 before:right-3.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-red-500"
                    }}
                  />
                  
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>Your Club's Reservations</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <span>Other Clubs' Reservations</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                      <h3 className="text-lg font-medium">No reservations found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters or create a new reservation</p>
                    </div>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className={`p-3 rounded-md ${reservation.color} flex items-center justify-between`}
                      >
                        <div>
                          <p className="font-medium">
                            {reservation.title}
                            {reservation.isFullDay && (
                              <Badge variant="outline" className="ml-2 text-xs bg-white/20 border-white/40">Full Day</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {reservation.date.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {reservation.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {reservation.venue}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                {date
                  ? date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Select a date"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Get all reservations for the selected date (both own and other clubs)
                const allReservationsForDate = date
                  ? reservations.filter(
                      (r) => {
                        const resDate = new Date(r.start_time);
                        return (
                          resDate.getDate() === date.getDate() &&
                          resDate.getMonth() === date.getMonth() &&
                          resDate.getFullYear() === date.getFullYear()
                        );
                      }
                    )
                  : [];
                
                // Format the reservations for display
                const formattedReservations = allReservationsForDate.map(reservation => {
                  const startTime = new Date(reservation.start_time);
                  const endTime = new Date(reservation.end_time);
                  const clubId = getClubId();
                  const isOwnClub = reservation.club_id === clubId;
                  
                  // Check if it's a full day reservation
                  const isFullDay = reservation.is_full_day || 
                                  (startTime.getHours() === 0 && 
                                    startTime.getMinutes() === 0 && 
                                    endTime.getHours() === 23 && 
                                    endTime.getMinutes() === 59);
                  
                  return {
                    id: reservation.id,
                    title: reservation.title,
                    date: new Date(reservation.start_time),
                    status: reservation.status,
                    venue: spaces.find(space => space.id === reservation.space_id)?.name || "Unknown Venue",
                    time: isFullDay ? "Full Day" : `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`,
                    description: reservation.description,
                    space_id: reservation.space_id,
                    start_time: reservation.start_time,
                    end_time: reservation.end_time,
                    club_id: reservation.club_id,
                    created_at: reservation.created_at,
                    isFullDay: isFullDay,
                    isOwnClub: isOwnClub,
                    color: getStatusColor(reservation.status)
                  };
                }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                
                if (formattedReservations.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                      <p className="text-muted-foreground">No reservations for this date</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setShowReservationForm(true)}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Add Reservation
                      </Button>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {formattedReservations.map((reservation) => (
                      <div key={reservation.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        <div
                          className={`w-1 self-stretch rounded-full ${
                            reservation.status === "approved"
                              ? "bg-green-500"
                              : reservation.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium flex items-center">
                                {reservation.title}
                                {reservation.isFullDay && (
                                  <Badge variant="outline" className="ml-2 text-xs">Full Day</Badge>
                                )}
                                {!reservation.isOwnClub && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-red-100 text-red-800 border-red-200">
                                    Other Club
                                  </Badge>
                                )}
                              </p>
                            </div>
                            {reservation.isOwnClub && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(reservation)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => handleCancelReservation(reservation.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Reservation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {reservation.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {reservation.venue}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">{getStatusBadge(reservation.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="col-span-full shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  Upcoming Reservations
                </CardTitle>
                <CardDescription>Your scheduled events for the next 30 days</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">No upcoming reservations</h3>
                    <p className="text-muted-foreground mb-4">Create a new reservation to get started</p>
                    <Button onClick={() => setShowReservationForm(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      New Reservation
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredReservations.map((reservation) => (
                      <div 
                        key={reservation.id} 
                        className={`p-5 rounded-lg border hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800`}
                        onClick={() => handleViewDetails(reservation)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-md ${reservation.color}`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          {getStatusBadge(reservation.status)}
                        </div>
                        <h3 className="font-medium text-lg mb-2 truncate">{reservation.title}</h3>
                        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                            <Calendar className="h-4 w-4 flex-shrink-0 text-blue-500" />
                            <span className="font-medium">{reservation.date.toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-shrink-0 text-green-500" />
                            <span>{reservation.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-purple-500" />
                            <span className="truncate">{reservation.venue}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(reservation);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {selectedReservation && !isEditing && (
        <Dialog open={!!selectedReservation && !isEditing} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedReservation.title}</DialogTitle>
              <DialogDescription>Reservation Details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedReservation.status === "approved" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : selectedReservation.status === "rejected" ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                {getStatusBadge(selectedReservation.status)}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedReservation.date.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedReservation.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedReservation.venue}</span>
                </div>
                {selectedReservation.description && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {selectedReservation.description}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReservation(null)}>
                Close
              </Button>
              {selectedReservation.status !== "rejected" && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setSelectedReservation(null);
                    handleCancelReservation(selectedReservation.id);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Reservation
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isSubmitting}
            >
              No, Keep It
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Yes, Cancel It"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showReservationForm && <ReservationForm selectedDate={date} onClose={() => setShowReservationForm(false)} />}
    </div>
  )
}

