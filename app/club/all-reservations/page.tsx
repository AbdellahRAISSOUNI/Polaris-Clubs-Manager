"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, Users, Building, CheckCircle2, Clock3, AlertCircle, X, TableIcon, CalendarIcon, Home, Settings } from "lucide-react"
import { BigCalendar } from "@/components/big-calendar"
import { Badge } from "@/components/ui/badge"
import { format, formatDistance } from "date-fns"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
}

export default function AllReservationsPage() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reservations')
      if (!response.ok) {
        throw new Error('Failed to fetch reservations')
      }
      const data = await response.json()
      setReservations(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching reservations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reservations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation)
  }

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
              onClick={fetchReservations}
              className="flex items-center gap-2"
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
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Refresh
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
          </div>
      </div>

        {viewMode === "calendar" ? (
          <div className="space-y-4">
            <div className="rounded-md border">
      <BigCalendar onReservationSelect={handleReservationSelect} />
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
                  {reservations.map((reservation) => {
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
                                  target.src = '/default-club-image.png';
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
              {reservations.map((reservation) => {
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
                              target.src = '/default-club-image.png';
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
          </div>
        )}
      </main>

      {selectedReservation && (
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={`/api/clubs/${selectedReservation.club_id}/image`} 
                    alt={selectedReservation.club_name || 'Club logo'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-club-image.png';
                    }}
                  />
                  <AvatarFallback>
                    {selectedReservation.club_name?.split(' ').map(word => word[0]).join('').toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl break-all">{selectedReservation.title}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    Reservation Details
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusInfo(selectedReservation.status).icon}
                <Badge variant="outline" className={`${getStatusInfo(selectedReservation.status).color} whitespace-nowrap`}>
                  {getStatusInfo(selectedReservation.status).label}
                </Badge>
              </div>
              <Separator />
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium break-all">{selectedReservation.club_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 flex-shrink-0" />
                  <span className="break-all">{selectedReservation.space_name}</span>
                    </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{format(new Date(selectedReservation.start_time), 'MMMM d, yyyy')}</span>
                  </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {format(new Date(selectedReservation.start_time), 'h:mm a')} -{' '}
                    {format(new Date(selectedReservation.end_time), 'h:mm a')}
                  </span>
                </div>
                {selectedReservation.description && (
                  <div className="mt-2 text-sm text-muted-foreground break-words">
                        {selectedReservation.description}
                    </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReservation(null)}>
                  Close
                </Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
} 