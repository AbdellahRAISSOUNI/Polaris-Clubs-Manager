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
  const [selectedVenue, setSelectedVenue] = useState("All Venues")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [viewMode, setViewMode] = useState("calendar")
  const [isMobile, setIsMobile] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [spaces, setSpaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
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
        // For now, we'll use a placeholder - in a real app, you'd get this from auth
        const clubId = getClubId()
        
        // Fetch reservations for this club
        const reservationsResponse = await fetch(`/api/reservations?clubId=${clubId}`)
        if (!reservationsResponse.ok) {
          throw new Error('Failed to fetch reservations')
        }
        const reservationsData = await reservationsResponse.json()
        setReservations(reservationsData)
        
        // Fetch spaces
        const spacesResponse = await fetch('/api/spaces')
        if (!spacesResponse.ok) {
          throw new Error('Failed to fetch spaces')
        }
        const spacesData = await spacesResponse.json()
        setSpaces(spacesData)
      } catch (err) {
        console.error('Error fetching data:', err)
        const errorMsg = err instanceof Error ? err.message : 'Failed to load data'
        setError(errorMsg)
        errorNotification({ description: errorMsg })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Helper function to format reservation data for display
  const formatReservations = (reservations: Reservation[]) => {
    return reservations.map(reservation => {
      const startTime = new Date(reservation.start_time)
      const endTime = new Date(reservation.end_time)
      const space = spaces.find(s => s.id === reservation.space_id)
      
      // Check if it's a full day reservation (either from the property or by checking times)
      const isFullDay = reservation.is_full_day || 
                        (startTime.getHours() === 0 && 
                         startTime.getMinutes() === 0 && 
                         endTime.getHours() === 23 && 
                         endTime.getMinutes() === 59);
      
      return {
        id: reservation.id,
        date: startTime,
        title: reservation.title,
        status: reservation.status,
        venue: space?.name || 'Unknown Venue',
        time: isFullDay ? "Full Day" : `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        color: getStatusColor(reservation.status),
        isFullDay
      }
    })
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

  // Filter reservations based on search, venue, and status
  const filteredReservations = isLoading ? [] : formatReservations(reservations).filter((reservation) => {
    const matchesSearch =
      reservation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.venue.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVenue = selectedVenue === "All Venues" || reservation.venue === selectedVenue
    const matchesStatus = selectedStatus === "all" || reservation.status === selectedStatus

    return matchesSearch && matchesVenue && matchesStatus
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

  // Function to determine which dates have reservations
  const getDatesWithReservations = (date: Date) => {
    return filteredReservations.some(
      (reservation) =>
        reservation.date.getDate() === date.getDate() &&
        reservation.date.getMonth() === date.getMonth() &&
        reservation.date.getFullYear() === date.getFullYear(),
    )
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
        <div className="container flex h-16 items-center justify-end px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback>SC</AvatarFallback>
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reservations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={async () => {
                setIsLoading(true)
                infoNotification({ description: "Refreshing dashboard data..." })
                try {
                  const clubId = getClubId()
                  
                  const reservationsResponse = await fetch(`/api/reservations?clubId=${clubId}`)
                  if (!reservationsResponse.ok) {
                    throw new Error('Failed to fetch reservations')
                  }
                  const reservationsData = await reservationsResponse.json()
                  setReservations(reservationsData)
                  
                  const spacesResponse = await fetch('/api/spaces')
                  if (!spacesResponse.ok) {
                    throw new Error('Failed to fetch spaces')
                  }
                  const spacesData = await spacesResponse.json()
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
              className="h-9 w-9"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              <span className="sr-only">Refresh</span>
            </Button>
            <Button onClick={() => setShowReservationForm(true)} className="gap-2">
              <Calendar className="h-4 w-4" />
              New Reservation
            </Button>
          </div>
        </div>

        {/* Reservation Statistics */}
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Total Reservations</p>
                  <p className="text-3xl font-bold">{reservations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold">
                    {reservations.filter(r => r.status === "approved").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold">
                    {reservations.filter(r => r.status === "pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-0.5 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold">
                    {reservations.filter(r => r.status === "rejected").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full lg:col-span-2">
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
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  modifiers={{
                    booked: (date) => getDatesWithReservations(date),
                  }}
                  modifiersClassNames={{
                  booked: "relative after:absolute after:top-1 after:right-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-red-500"
                  }}
                />
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

          <Card>
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
              {reservationsForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                  <p className="text-muted-foreground">No reservations for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservationsForSelectedDate.map((reservation) => (
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
                          <p className="font-medium">
                            {reservation.title}
                            {reservation.isFullDay && (
                              <Badge variant="outline" className="ml-2 text-xs">Full Day</Badge>
                            )}
                          </p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(reservation)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditReservation(reservation)}>
                                Edit Reservation
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 dark:text-red-400"
                                onClick={() => handleCancelReservation(reservation.id)}
                              >
                                Cancel Reservation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Upcoming Reservations</CardTitle>
              <CardDescription>Your scheduled events for the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium">No upcoming reservations</h3>
                    <p className="text-muted-foreground">Create a new reservation to get started</p>
                  </div>
                ) : (
                  filteredReservations.map((reservation) => (
                    <div key={reservation.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                      <div className={`p-2 rounded-md ${reservation.color}`}>
                        <Calendar className="h-5 w-5" />
                      </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {reservation.title}
                          {reservation.isFullDay && (
                            <Badge variant="outline" className="ml-2 text-xs">Full Day</Badge>
                          )}
                        </p>
                          {getStatusBadge(reservation.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{reservation.date.toLocaleDateString()}</span>
                        </div>
                          <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{reservation.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{reservation.venue}</span>
                        </div>
                        </div>
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
              <Button onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedReservation && isEditing && (
        <Dialog open={!!selectedReservation && isEditing} onOpenChange={() => {
          setIsEditing(false);
          setSelectedReservation(null);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Reservation</DialogTitle>
              <DialogDescription>Update the details of your reservation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={editedTitle} 
                  onChange={(e) => setEditedTitle(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={editedDescription} 
                  onChange={(e) => setEditedDescription(e.target.value)} 
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setSelectedReservation(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
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

