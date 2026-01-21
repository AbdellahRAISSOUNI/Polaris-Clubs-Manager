"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  Filter,
  Home,
  MapPin,
  PieChart,
  Search,
  Settings,
  ShieldCheck,
  Users,
  XCircle,
  Calendar,
} from "lucide-react"
import { ReservationDetails } from "@/components/reservation-details"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminLayout } from "@/components/admin-layout"
import { useAdminUser } from "@/hooks/useAdminUser"
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

// Define the Space type
interface Space {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  image: string;
}

// Define the Club type
interface Club {
  id: string;
  name: string;
  description: string;
  email: string;
  logo: string;
  members: number;
}

// Mock data - replace with actual data from your backend
const mockReservations = [
  {
    id: 1,
    clubName: "Basketball Club",
    clubLogo: "/placeholder.svg?height=40&width=40",
    date: new Date(2025, 2, 15),
    title: "Basketball Practice",
    status: "approved",
    venue: "Main Hall",
    time: "14:00-16:00",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: 2,
    clubName: "Chess Club",
    clubLogo: "/placeholder.svg?height=40&width=40",
    date: new Date(2025, 2, 20),
    title: "Chess Tournament",
    status: "pending",
    venue: "Conference Room",
    time: "10:00-13:00",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    id: 3,
    clubName: "Debate Club",
    clubLogo: "/placeholder.svg?height=40&width=40",
    date: new Date(2025, 3, 5),
    title: "Debate Club Meeting",
    status: "rejected",
    venue: "Classroom A",
    time: "15:00-17:00",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    id: 4,
    clubName: "Photography Club",
    clubLogo: "/placeholder.svg?height=40&width=40",
    date: new Date(2025, 3, 10),
    title: "Photo Exhibition",
    status: "pending",
    venue: "Exhibition Hall",
    time: "12:00-18:00",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    id: 5,
    clubName: "Science Club",
    clubLogo: "/placeholder.svg?height=40&width=40",
    date: new Date(2025, 3, 15),
    title: "Science Experiment",
    status: "pending",
    venue: "Laboratory",
    time: "13:00-15:00",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    id: 6,
    clubName: "Music Club",
    clubLogo: "/placeholder.svg?height=40&width=40",
    date: new Date(2025, 3, 18),
    title: "Concert Rehearsal",
    status: "approved",
    venue: "Auditorium",
    time: "16:00-19:00",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
]

// Mock venues
const venues = [
  "All Venues",
  "Main Hall",
  "Conference Room",
  "Classroom A",
  "Classroom B",
  "Exhibition Hall",
  "Laboratory",
  "Auditorium",
  "Outdoor Field",
]

// Mock clubs
const clubs = [
  "All Clubs",
  "Basketball Club",
  "Chess Club",
  "Debate Club",
  "Photography Club",
  "Science Club",
  "Music Club",
]

export default function AdminDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVenue, setSelectedVenue] = useState("All Venues")
  const [selectedClub, setSelectedClub] = useState("All Clubs")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [periodScope, setPeriodScope] = useState<"all" | "mandate" | "academicYear">("mandate")
  const [periodMode, setPeriodMode] = useState<"current" | "previous" | "specific">("current")
  const [specificPeriodId, setSpecificPeriodId] = useState<string>("")
  const [mandates, setMandates] = useState<TimePeriod[]>([])
  const [academicYears, setAcademicYears] = useState<TimePeriod[]>([])
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { adminUser } = useAdminUser()

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

  // Fetch time periods on mount (used for mandate/year filtering)
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

        // Default: current mandate
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

  // Fetch spaces and clubs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch spaces
        const spacesResponse = await fetch('/api/spaces')
        if (!spacesResponse.ok) {
          throw new Error('Failed to fetch spaces')
        }
        const spacesData = await spacesResponse.json()
        setSpaces(spacesData)
        
        // Fetch clubs
        const clubsResponse = await fetch('/api/clubs')
        if (!clubsResponse.ok) {
          throw new Error('Failed to fetch clubs')
        }
        const clubsData = await clubsResponse.json()
        setClubs(clubsData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    }
    
    fetchData()
  }, [])

  // Fetch reservations whenever the active time filter changes
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (periodScope !== "all" && activePeriodId) {
          params.set("periodType", periodScope)
          params.set("periodId", activePeriodId)
        }

        const url = params.toString() ? `/api/reservations?${params.toString()}` : "/api/reservations"
        const reservationsResponse = await fetch(url)
        if (!reservationsResponse.ok) throw new Error("Failed to fetch reservations")
        const reservationsData = await reservationsResponse.json()
        setReservations(reservationsData)
        setError(null)
      } catch (err) {
        console.error("Error fetching reservations:", err)
        setError(err instanceof Error ? err.message : "Failed to load reservations")
      } finally {
        setIsLoading(false)
      }
    }

    // If mandate/year scope is selected but there is no active period yet, avoid fetching a 404 and wait.
    if (periodScope !== "all" && !activePeriodId) {
      setReservations([])
      return
    }

    fetchReservations()
  }, [periodScope, periodMode, specificPeriodId, mandates, academicYears])

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
      const club = clubs.find(c => c.id === reservation.club_id)
      
      // Check if it's a full day reservation (either from the property or by checking times)
      const isFullDay = reservation.is_full_day || 
                        (startTime.getHours() === 0 && 
                         startTime.getMinutes() === 0 && 
                         endTime.getHours() === 23 && 
                         endTime.getMinutes() === 59);
      
      return {
        id: reservation.id,
        clubName: club?.name || 'Unknown Club',
        clubLogo: club?.logo || '/placeholder.svg?height=40&width=40',
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

  // Helper function to get dates with reservations
  const getDatesWithReservations = (date: Date) => {
    return reservations.some(reservation => {
      const resDate = new Date(reservation.start_time)
      return (
        resDate.getDate() === date.getDate() &&
        resDate.getMonth() === date.getMonth() &&
        resDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Helper function to get status color
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
      reservation.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.clubName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVenue = selectedVenue === "All Venues" || reservation.venue === selectedVenue
    const matchesClub = selectedClub === "All Clubs" || reservation.clubName === selectedClub
    const matchesStatus = selectedStatus === "all" || reservation.status === selectedStatus

    return matchesSearch && matchesVenue && matchesClub && matchesStatus
  })

  const pendingReservations = filteredReservations.filter((r) => r.status === "pending")
  const approvedReservations = filteredReservations.filter((r) => r.status === "approved")
  const rejectedReservations = filteredReservations.filter((r) => r.status === "rejected")

  // Get reservations for the selected date
  const reservationsForSelectedDate = date
    ? filteredReservations.filter(
        (r) =>
          r.date.getDate() === date.getDate() &&
          r.date.getMonth() === date.getMonth() &&
          r.date.getFullYear() === date.getFullYear(),
      )
    : []

  // Get today's reservations
  const todaysReservations = filteredReservations.filter((r) => {
    const today = new Date()
    return (
      r.date.getDate() === today.getDate() &&
      r.date.getMonth() === today.getMonth() &&
      r.date.getFullYear() === today.getFullYear()
    )
  })

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

  // Calculate venue usage statistics
  const venueUsageStats = venues
    .slice(1)
    .map((venue) => {
      const totalReservations = filteredReservations.filter((r) => r.venue === venue).length
      const percentage = (totalReservations / filteredReservations.length) * 100

      return {
        venue,
        count: totalReservations,
        percentage: Math.round(percentage),
      }
    })
    .sort((a, b) => b.count - a.count)

  // Handle reservation status change
  const handleReservationStatusChange = async () => {
    // Refresh the reservations data
    try {
      const params = new URLSearchParams()
      if (periodScope !== "all" && activePeriodId) {
        params.set("periodType", periodScope)
        params.set("periodId", activePeriodId)
      }
      const url = params.toString() ? `/api/reservations?${params.toString()}` : "/api/reservations"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch reservations')
      }
      const data = await response.json()
      setReservations(data)
    } catch (err) {
      console.error('Error refreshing reservations:', err)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Hello, <span className="font-medium">{adminUser?.name || 'Admin'}</span>! Welcome to your dashboard.
          </p>
        </div>
        
        {/* Mobile search - visible only on mobile */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reservations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Time period filter */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
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
                      <Select
                        value={specificPeriodId}
                        onValueChange={(value) => setSpecificPeriodId(value)}
                      >
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
                No matching period found for "{periodMode}". Create periods in Admin Settings.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleReservationStatusChange}
              className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-auto justify-center"
              size="sm"
            >
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
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete all rejected reservations? This action cannot be undone.')) {
                  try {
                    const response = await fetch('/api/reservations/delete-rejected', {
                      method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Failed to delete rejected reservations');
                    await handleReservationStatusChange();
                    alert('Rejected reservations have been deleted successfully');
                  } catch (error) {
                    console.error('Error deleting rejected reservations:', error);
                    alert('Failed to delete rejected reservations');
                  }
                }
              }}
              className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-auto justify-center"
              size="sm"
            >
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Delete Rejected
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between space-x-2 sm:space-x-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">{filteredReservations.length}</p>
                </div>
                <div className="p-1 sm:p-1.5 md:p-2 bg-blue-100 rounded-full dark:bg-blue-900/30">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between space-x-2 sm:space-x-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pending</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    {filteredReservations.filter((r) => r.status === "pending").length}
                  </p>
                </div>
                <div className="p-1 sm:p-1.5 md:p-2 bg-yellow-100 rounded-full dark:bg-yellow-900/30">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between space-x-2 sm:space-x-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Approved</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    {filteredReservations.filter((r) => r.status === "approved").length}
                  </p>
                </div>
                <div className="p-1 sm:p-1.5 md:p-2 bg-green-100 rounded-full dark:bg-green-900/30">
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between space-x-2 sm:space-x-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Rejected</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    {filteredReservations.filter((r) => r.status === "rejected").length}
                  </p>
                </div>
                <div className="p-1 sm:p-1.5 md:p-2 bg-red-100 rounded-full dark:bg-red-900/30">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Reservation Calendar</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Overview of all club reservations</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleReservationStatusChange}
                    className="flex items-center gap-1 sm:gap-2 text-xs"
                    size="sm"
                  >
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
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    Refresh
                  </Button>
                  <Button asChild size="sm" className="text-xs">
                    <Link href="/admin/all-reservations" className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      View All
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6 overflow-x-auto">
              <div className="min-w-[280px]">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  showOutsideDays={true}
                  modifiers={{
                    booked: (date) => getDatesWithReservations(date),
                  }}
                  modifiersClassNames={{
                    booked: "relative after:absolute after:top-1 after:right-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-red-500"
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Selected Date Schedule</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
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
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                {reservationsForSelectedDate.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                    <p className="text-sm text-muted-foreground">No reservations for this date</p>
                  </div>
                ) : (
                  reservationsForSelectedDate.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center gap-2 sm:gap-4 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setSelectedReservation({
                        ...reservation,
                        isFullDay: reservation.isFullDay
                      })}
                    >
                      <Avatar className="h-7 w-7 sm:h-9 sm:w-9">
                        <AvatarImage src={reservation.clubLogo} alt={reservation.clubName} />
                        <AvatarFallback>
                          {reservation.clubName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{reservation.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {reservation.clubName} • {reservation.venue} • {reservation.time}
                        </p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedReservation && (
        <ReservationDetails
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onStatusChange={handleReservationStatusChange}
        />
      )}
    </AdminLayout>
  )
}

