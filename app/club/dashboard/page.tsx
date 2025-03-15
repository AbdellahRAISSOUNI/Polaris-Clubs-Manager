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
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"

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

  // Fetch reservations and spaces on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get the club ID from localStorage or context
        const clubId = getClubId()
        
        // Fetch reservations for this club
        const reservationsResponse = await fetch(`/api/reservations?clubId=${clubId}`)
        if (!reservationsResponse.ok) {
          throw new Error('Failed to fetch reservations')
        }
        const reservationsData = await reservationsResponse.json()
        
        // Fetch all reservations (for showing other clubs' bookings)
        const allReservationsResponse = await fetch('/api/reservations')
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
    
    fetchData()
  }, [])

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
      const { error } = await supabase
        .from('reservations')
        .update({
          title: editedTitle,
          description: editedDescription
        })
        .eq('id', selectedReservation.id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationToDelete);

      if (error) throw error;

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
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg sm:text-xl">Club Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
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
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
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

      <main className="flex-1 px-4 py-4 space-y-4 sm:p-6 sm:space-y-6">
        <div className="flex flex-col gap-4">
          <Button 
            onClick={() => setShowReservationForm(true)} 
            size="lg"
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md h-12 sm:h-14 text-base sm:text-lg rounded-xl"
          >
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            New Reservation
          </Button>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 sm:h-28">
                <p className="text-2xl sm:text-3xl font-bold mb-1">
                  {clubReservations.filter(r => r.status === "pending").length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 sm:h-28">
                <p className="text-2xl sm:text-3xl font-bold mb-1">
                  {clubReservations.filter(r => r.status === "approved").length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base sm:text-lg">Calendar View</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-lg border-0 shadow-none [&_.rdp-caption]:text-base [&_.rdp-head_th]:text-sm [&_.rdp-button]:text-sm [&_.rdp-button]:h-10 [&_.rdp-button]:w-10"
                modifiers={{
                  ownBooked: (date) => getOwnReservationDates(date),
                  otherBooked: (date) => getOtherReservationDates(date),
                }}
                modifiersClassNames={{
                  ownBooked: "relative after:absolute after:top-1 after:right-1 after:h-2 after:w-2 after:rounded-full after:bg-blue-500",
                  otherBooked: "relative before:absolute before:top-1 before:right-4 before:h-2 before:w-2 before:rounded-full before:bg-red-500"
                }}
              />
              
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                  <span>Your Bookings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                  <span>Others</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Today's Schedule</CardTitle>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-3">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-3" />
                    <p className="text-sm text-muted-foreground">No events today</p>
                  </div>
                ) : (
                  filteredReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-3 rounded-xl bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewDetails(reservation)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate mb-1">
                            {reservation.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{reservation.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{reservation.venue}</span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(reservation.status)}
                      </div>
                    </div>
                  ))
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

