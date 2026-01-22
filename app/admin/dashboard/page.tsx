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
import { motion, AnimatePresence } from "framer-motion"
import { ReservationDetails } from "@/components/reservation-details"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "@/components/admin-sidebar"
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
import { successNotification, errorNotification } from "@/lib/notifications"
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
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteRejectedConfirm, setShowDeleteRejectedConfirm] = useState(false)
  const [isDeletingRejected, setIsDeletingRejected] = useState(false)
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
        // Parallelize API calls for better performance
        const [spacesResponse, clubsResponse] = await Promise.all([
          fetch('/api/spaces'),
          fetch('/api/clubs')
        ])
        
        if (!spacesResponse.ok) {
          throw new Error('Failed to fetch spaces')
        }
        if (!clubsResponse.ok) {
          throw new Error('Failed to fetch clubs')
        }
        
        const [spacesData, clubsData] = await Promise.all([
          spacesResponse.json(),
          clubsResponse.json()
        ])
        
        setSpaces(spacesData)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-8 sm:pb-12 overflow-x-hidden">
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        
        {/* Mobile search - visible only on mobile */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden mb-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Search reservations..."
              className="pl-10 h-11 rounded-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-apple transition-apple focus:bg-white dark:focus:bg-gray-900/90"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Time period filter - Collapsible */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="mb-4 sm:mb-6 overflow-hidden"
            >
              <Card className="glass shadow-apple border-0 rounded-3xl">
                <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end">
                <div className="flex-1">
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
                    <SelectTrigger className="mt-1 h-10 text-xs rounded-2xl glass border-0 shadow-apple">
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
                      <Label className="text-xs">Period</Label>
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
                        <SelectTrigger className="mt-1 h-10 text-xs rounded-2xl glass border-0 shadow-apple">
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
                        <Label className="text-xs">{periodScope === "mandate" ? "Mandat" : "Année scolaire"}</Label>
                        <Select
                          value={specificPeriodId}
                          onValueChange={(value) => setSpecificPeriodId(value)}
                        >
                          <SelectTrigger className="mt-1 h-10 text-xs rounded-2xl glass border-0 shadow-apple">
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
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-light">
              Welcome back, <span className="font-medium text-foreground">{adminUser?.name || 'Admin'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={handleReservationStatusChange}
                className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-auto justify-center h-10 sm:h-11 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
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
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 sm:gap-2 text-xs h-10 sm:h-11 rounded-2xl border-0 shadow-apple hover:shadow-apple-lg transition-apple bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                title="Time Period Filters"
              >
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Period</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteRejectedConfirm(true)}
                disabled={isDeletingRejected}
                className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-auto justify-center h-10 sm:h-11 rounded-2xl border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                size="sm"
              >
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Delete Rejected
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4 }}
          >
            <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-semibold">{filteredReservations.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl backdrop-blur-sm">
                    <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                      {filteredReservations.filter((r) => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl backdrop-blur-sm">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <Card className="glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Approved</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                      {filteredReservations.filter((r) => r.status === "approved").length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl backdrop-blur-sm">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            whileHover={{ y: -4 }}
          >
            <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Rejected</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-semibold">
                      {filteredReservations.filter((r) => r.status === "rejected").length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl backdrop-blur-sm">
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="col-span-1 md:col-span-2"
          >
            <Card className="glass shadow-apple-lg border-0 rounded-3xl overflow-hidden">
              <CardHeader className="p-5 sm:p-6 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-semibold mb-1">Reservation Calendar</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Overview of all club reservations</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        onClick={handleReservationStatusChange}
                        className="flex items-center gap-1 sm:gap-2 text-xs h-9 rounded-2xl glass border-0 shadow-apple"
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
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button asChild size="sm" className="text-xs h-9 rounded-2xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 border-0 shadow-apple transition-apple">
                        <Link href="/admin/all-reservations" className="flex items-center gap-1 sm:gap-2">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          View All
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8 overflow-x-auto">
                <div className="min-w-[280px]">
                  <div className="glass-strong rounded-3xl p-4 shadow-apple">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-2xl border-0"
                      showOutsideDays={true}
                      modifiers={{
                        booked: (date) => getDatesWithReservations(date),
                      }}
                      modifiersClassNames={{
                        booked: "relative after:absolute after:top-1 after:right-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-red-500"
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <Card className="glass shadow-apple-lg border-0 rounded-3xl overflow-hidden h-full">
              <CardHeader className="p-5 sm:p-6 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-900/50">
                <CardTitle className="text-lg sm:text-xl font-semibold mb-1">Selected Date Schedule</CardTitle>
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
                <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {reservationsForSelectedDate.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 sm:py-12"
                    >
                      <Clock className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground opacity-50 mb-3" />
                      <p className="text-sm text-muted-foreground">No reservations for this date</p>
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      {reservationsForSelectedDate.map((reservation, index) => (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg cursor-pointer transition-apple"
                          onClick={() => setSelectedReservation({
                            ...reservation,
                            isFullDay: reservation.isFullDay
                          })}
                        >
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white/50 dark:ring-gray-800/50">
                            <AvatarImage src={reservation.clubLogo} alt={reservation.clubName} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {reservation.clubName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium truncate mb-1">{reservation.title}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {reservation.clubName} • {reservation.venue} • {reservation.time}
                            </p>
                          </div>
                          {getStatusBadge(reservation.status)}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </div>
      </div>

      {selectedReservation && (
        <ReservationDetails
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onStatusChange={handleReservationStatusChange}
        />
      )}

      {/* Delete All Rejected Reservations Confirmation Dialog */}
      <AlertDialog open={showDeleteRejectedConfirm} onOpenChange={setShowDeleteRejectedConfirm}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] glass-strong rounded-3xl border-0 shadow-apple-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Rejected Reservations?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all rejected reservations? This action cannot be undone.
              All rejected reservations will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingRejected}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setIsDeletingRejected(true)
                try {
                  const response = await fetch('/api/reservations/delete-rejected', {
                    method: 'DELETE',
                  });
                  if (!response.ok) throw new Error('Failed to delete rejected reservations');
                  await handleReservationStatusChange();
                  setShowDeleteRejectedConfirm(false)
                  successNotification({
                    title: "Success",
                    description: "Rejected reservations have been deleted successfully"
                  })
                } catch (error) {
                  console.error('Error deleting rejected reservations:', error);
                  errorNotification({
                    title: "Error",
                    description: "Failed to delete rejected reservations"
                  })
                } finally {
                  setIsDeletingRejected(false)
                }
              }}
              disabled={isDeletingRejected}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingRejected ? (
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
    </AdminLayout>
  )
}

