"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, Users, Building, CheckCircle2, Clock3, AlertCircle, X, Home, Settings, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format, formatDistance } from "date-fns"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getClubId } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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
}

export default function ReservationsPage() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      const clubId = getClubId()
      
      if (!clubId) {
        throw new Error('No club ID found. Please make sure you are logged in.')
      }

      // Test connection first
      const { error: testError } = await supabase.from('reservations').select('count').single()
      if (testError) {
        console.error('Connection test error:', testError)
        if (testError.message.includes('FetchError') || testError.message.includes('network')) {
          throw new Error('Unable to connect to the server. Please check your internet connection.')
        }
        throw new Error('Database connection error: ' + testError.message)
      }

      console.log('Fetching reservations for club:', clubId)
      
      // First, get all reservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('club_id', clubId)
        .order('start_time', { ascending: true })
      
      if (reservationsError) {
        console.error('Supabase error:', reservationsError)
        if (reservationsError.code === 'PGRST116') {
          throw new Error('Invalid club ID format')
        } else if (reservationsError.code === '42501') {
          throw new Error('You do not have permission to view these reservations')
        } else {
          throw reservationsError
        }
      }

      if (!reservationsData) {
        console.log('No reservations data returned from query')
        setReservations([])
        return
      }

      // Then, get all spaces
      const { data: spacesData } = await supabase
        .from('spaces')
        .select('id, name')

      // Create a map of space IDs to names
      const spaceMap = new Map(
        spacesData?.map(space => [space.id, space.name]) || []
      )

      // Combine the data
      const reservationsWithSpaceNames = reservationsData.map(reservation => ({
        ...reservation,
        space_name: spaceMap.get(reservation.space_id) || 'Unknown Space'
      }))

      console.log('Processed reservations:', reservationsWithSpaceNames)
      
      setReservations(reservationsWithSpaceNames)
      setError(null)
    } catch (err) {
      console.error('Error details:', err)
      let errorMessage = 'Failed to load reservations. Please try again.'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message)
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationToDelete)

      if (error) throw error

      setReservations(prev => prev.filter(res => res.id !== reservationToDelete))
      toast.success("Reservation deleted successfully")
    } catch (err) {
      console.error('Error deleting reservation:', err)
      toast.error("Failed to delete reservation")
    } finally {
      setDeleteConfirmOpen(false)
      setReservationToDelete(null)
    }
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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reservations</h1>
          <p className="text-muted-foreground">
            Manage your club's space reservations
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
          <Link href="/club/dashboard">
            <Button>
              New Reservation
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-gray-950">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchReservations}>
              Try Again
            </Button>
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-muted-foreground">No reservations found</p>
            <Link href="/club/dashboard">
              <Button size="sm">
                Create New Reservation
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Space</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => {
                    const statusInfo = getStatusInfo(reservation.status)
                    return (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <span className="font-medium">{reservation.title}</span>
                        </TableCell>
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReservation(reservation)}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setReservationToDelete(reservation.id)
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            Delete
                          </Button>
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
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="space-y-1">
                        <h3 className="font-medium">{reservation.title}</h3>
                        <div className="text-sm text-muted-foreground">{reservation.space_name}</div>
                      </div>
                      <Badge variant="outline" className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
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
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedReservation(reservation)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setReservationToDelete(reservation.id)
                          setDeleteConfirmOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* View Reservation Dialog */}
      {selectedReservation && (
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div>
                <DialogTitle className="text-xl break-all">{selectedReservation.title}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Reservation Details
                </DialogDescription>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReservation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 