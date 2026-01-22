"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, Users, Building, CheckCircle2, Clock3, AlertCircle, X, TableIcon, CalendarIcon, Home, Settings, Filter } from "lucide-react"
import { BigCalendar } from "@/components/big-calendar"
import { Badge } from "@/components/ui/badge"
import { format, formatDistance } from "date-fns"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  space_name?: string;
  club_name?: string;
  admin_message?: string;
}

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
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlightedReservationId, setHighlightedReservationId] = useState<string | null>(null)
  const [periodScope, setPeriodScope] = useState<"all" | "mandate" | "academicYear">("mandate")
  const [periodMode, setPeriodMode] = useState<"current" | "previous" | "specific">("current")
  const [specificPeriodId, setSpecificPeriodId] = useState<string>("")
  const [mandates, setMandates] = useState<TimePeriod[]>([])
  const [academicYears, setAcademicYears] = useState<TimePeriod[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  const searchParams = useSearchParams()
  const reservationIdFromUrl = searchParams.get('id')

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

  // Use useCallback to memoize the fetchReservations function
  const fetchReservations = useCallback(async () => {
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
      
      if (reservationIdFromUrl) {
        setHighlightedReservationId(reservationIdFromUrl)
        const reservation = data.find((r: Reservation) => r.id === reservationIdFromUrl)
        if (reservation) {
          setSelectedReservation(reservation)
          setViewMode("calendar")
        }
      }
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reservations')
    } finally {
      setIsLoading(false)
    }
  }, [reservationIdFromUrl, activePeriodType, activePeriodId, setIsLoading, setReservations, setError, setHighlightedReservationId, setSelectedReservation, setViewMode])

  useEffect(() => {
    if (periodScope !== "all" && !activePeriodId) {
      setReservations([])
      setIsLoading(false)
      return
    }
    fetchReservations()
  }, [fetchReservations])

  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation)
  }

  // Pagination calculations
  const totalPages = Math.ceil(reservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReservations = reservations.slice(startIndex, endIndex)

  // Reset to page 1 when period changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activePeriodType, activePeriodId])

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
          icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
          label: 'Approved',
          description: 'This reservation has been approved.'
        }
      case "pending":
        return {
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
          icon: <Clock3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
          label: 'Pending',
          description: 'This reservation is awaiting approval.'
        }
      case "rejected":
        return {
          color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
          icon: <X className="h-5 w-5 text-red-600 dark:text-red-400" />,
          label: 'Rejected',
          description: 'This reservation has been rejected.'
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

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return formatDistance(startDate, endDate)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Clubs Calendar</h1>
          <p className="text-muted-foreground">
            View reservations from all clubs across the campus
          </p>
        </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchReservations()
                setHighlightedReservationId(null)
              }}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                    className="h-4 w-4"
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
              className="flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              title="Time Period Filters"
            >
              <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Period</span>
            </Button>
          </div>
      </div>

      {/* Time period filter - Collapsible */}
      {showFilters && (
        <div className="rounded-lg border bg-white dark:bg-gray-950 p-2 sm:p-3 animate-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
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
            <div className="md:col-span-2 flex items-end">
              <p className="text-xs text-muted-foreground">Showing all reservations</p>
            </div>
          )}
        </div>
      </div>
      )}

        {viewMode === "calendar" ? (
          <div className="space-y-4">
            <div className="rounded-md border">
      <BigCalendar 
        onReservationSelect={handleReservationSelect} 
        highlightedReservationId={highlightedReservationId}
        periodType={activePeriodType || undefined}
        periodId={activePeriodId || undefined}
      />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span>Rejected</span>
                      </div>
                    </div>
                  </div>
        ) : (
          <div className="rounded-md border bg-white dark:bg-gray-950">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Space</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReservations.map((reservation) => {
                    const statusInfo = getStatusInfo(reservation.status)
                    return (
                      <TableRow key={reservation.id} onClick={() => handleReservationSelect(reservation)} className="cursor-pointer">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={`/api/clubs/${reservation.club_id}/image`} 
                                alt={reservation.club_name || 'Club logo'}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src && !target.src.includes('placeholder-logo.png')) {
                                    target.src = '/placeholder-logo.png';
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                              <AvatarFallback>
                                {reservation.club_name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{reservation.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{reservation.club_name}</TableCell>
                        <TableCell>{reservation.space_name}</TableCell>
                        <TableCell>
                          {format(new Date(reservation.start_time), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>{getDuration(reservation.start_time, reservation.end_time)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden divide-y">
              {paginatedReservations.map((reservation) => {
                const statusInfo = getStatusInfo(reservation.status)
                return (
                  <div
                    key={reservation.id}
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    onClick={() => handleReservationSelect(reservation)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={`/api/clubs/${reservation.club_id}/image`} 
                            alt={reservation.club_name || 'Club logo'}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (target.src && !target.src.includes('placeholder-logo.png')) {
                                    target.src = '/placeholder-logo.png';
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                          />
                          <AvatarFallback>
                            {reservation.club_name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                  <div className="space-y-1">
                          <h3 className="font-medium">{reservation.title}</h3>
                          <div className="text-sm text-muted-foreground">{reservation.club_name}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{reservation.space_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(reservation.start_time), 'MMM d, yyyy')}</span>
                  </div>
                      <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(reservation.start_time), 'h:mm a')} -{' '}
                          {format(new Date(reservation.end_time), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                        <Clock3 className="h-3 w-3" />
                        <span>{getDuration(reservation.start_time, reservation.end_time)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 px-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={reservations.length}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {selectedReservation && (
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="p-0 overflow-hidden w-[100dvw] h-[100dvh] max-w-none rounded-none sm:rounded-lg sm:h-[90vh] sm:max-h-[90vh] sm:max-w-[520px] [&>button.absolute.right-4.top-4]:hidden" style={{ maxHeight: '100dvh' }}>
            <div className="flex h-full flex-col min-h-0" style={{ height: '100%', maxHeight: '100%' }}>
              <DialogHeader className="shrink-0 p-4 sm:p-6 border-b bg-background">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={`/api/clubs/${selectedReservation.club_id}/image`}
                        alt={selectedReservation.club_name || 'Club logo'}
                      />
                      <AvatarFallback>
                        {selectedReservation.club_name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <DialogTitle className="text-lg sm:text-xl leading-tight line-clamp-2">{selectedReservation.title}</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                        Reservation details
                      </DialogDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-8 sm:w-8"
                    onClick={() => setSelectedReservation(null)}
                    aria-label="Close reservation details"
                  >
                    <X className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-6 pb-6" style={{ WebkitOverflowScrolling: 'touch', height: '100%', maxHeight: '100%', overflowY: 'auto' }}>
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusInfo(selectedReservation.status).icon}
                    <Badge variant="outline" className={`${getStatusInfo(selectedReservation.status).color} whitespace-nowrap rounded-full px-3 py-1 text-xs sm:text-sm`}>
                      {getStatusInfo(selectedReservation.status).label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span className="font-medium break-all">{selectedReservation.club_name}</span>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="break-all">{selectedReservation.space_name}</span>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span>{format(new Date(selectedReservation.start_time), 'MMMM d, yyyy')}</span>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-x-2 items-start">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>
                      {format(new Date(selectedReservation.start_time), 'h:mm a')} -{' '}
                      {format(new Date(selectedReservation.end_time), 'h:mm a')}
                    </span>
                  </div>
                  
                  {selectedReservation.description && (
                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {selectedReservation.description}
                    </div>
                  )}
                  
                  {selectedReservation.admin_message && (
                    <div className="mt-1">
                      <h4 className="text-sm font-medium mb-2">
                        {selectedReservation.status === 'rejected' ? 'Rejection Reason' : 'Admin Message'}
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
                        {selectedReservation.admin_message}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 