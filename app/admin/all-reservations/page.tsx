"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, Users, Building, CheckCircle2, Clock3, AlertCircle, X, TableIcon, CalendarIcon } from "lucide-react"
import { BigCalendar } from "@/components/big-calendar"
import { Badge } from "@/components/ui/badge"
import { format, formatDistance } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { AdminLayout } from "@/components/admin-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  is_full_day?: boolean;
}

export default function AdminAllReservationsPage() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [reservationStatus, setReservationStatus] = useState<string>("")
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch reservations on mount
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/reservations')
        if (!response.ok) {
          throw new Error('Failed to fetch reservations')
        }
        const data = await response.json()
        setReservations(data)
      } catch (err) {
        console.error('Error fetching reservations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load reservations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReservations()
  }, [])

  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setReservationStatus(reservation.status)
    setIsDetailsOpen(true)
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
    
    // Here you would update the reservation status in your database
    // For example:
    // await updateReservationStatus(selectedReservation.id, newStatus)
    
    // For now, we'll just update the local state
    setSelectedReservation({
      ...selectedReservation,
      status: newStatus
    })
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Clubs Calendar</h1>
            <p className="text-muted-foreground">
              View and manage reservations from all clubs across the campus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                fetch('/api/reservations')
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
          <div className="rounded-md border">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading reservations...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                {error}
              </div>
            ) : reservations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No reservations found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation: Reservation) => {
                    const startTime = new Date(reservation.start_time)
                    const endTime = new Date(reservation.end_time)
                    return (
                      <TableRow
                        key={reservation.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <TableCell>
                          {format(startTime, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {reservation.club_name || 'Unknown Club'}
                            <img
                              src={`/api/clubs/${reservation.club_id}/image`}
                              alt={reservation.club_name || 'Club logo'}
                              className="h-6 w-6 rounded-full object-cover"
                              onError={(e) => {
                                // If image fails to load, replace with default
                                e.currentTarget.src = '/default-club-image.png'
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell 
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => handleReservationSelect(reservation)}
                        >
                          {reservation.title}
                        </TableCell>
                        <TableCell>
                          {reservation.is_full_day ? (
                            <Badge variant="outline">Full Day</Badge>
                          ) : (
                            `${format(startTime, "h:mm a")} - ${format(endTime, "h:mm a")}`
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              reservation.status === "approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : reservation.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }
                          >
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {reservation.status !== 'approved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(`/api/reservations/${reservation.id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'approved' })
                                    });
                                    if (!response.ok) throw new Error('Failed to update status');
                                    // Refresh reservations
                                    const updatedReservations = reservations.map(r => 
                                      r.id === reservation.id ? { ...r, status: 'approved' } : r
                                    );
                                    setReservations(updatedReservations);
                                  } catch (error) {
                                    console.error('Error updating reservation:', error);
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {reservation.status !== 'rejected' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(`/api/reservations/${reservation.id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'rejected' })
                                    });
                                    if (!response.ok) throw new Error('Failed to update status');
                                    // Refresh reservations
                                    const updatedReservations = reservations.map(r => 
                                      r.id === reservation.id ? { ...r, status: 'rejected' } : r
                                    );
                                    setReservations(updatedReservations);
                                  } catch (error) {
                                    console.error('Error updating reservation:', error);
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-[#0B1120] text-white border-gray-800 max-h-[90vh] flex flex-col">
            {selectedReservation && (
              <>
                {/* Fixed Header */}
                <div className="flex items-start justify-between p-4 border-b border-gray-800 bg-[#0B1120] sticky top-0 z-20">
                  <div>
                    <h2 className="text-xl font-semibold mb-0.5">
                      {selectedReservation.title}
                    </h2>
                    <p className="text-sm text-gray-400">
                      Reservation #{selectedReservation.id.substring(0, 8)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white -mr-2"
                    onClick={() => setIsDetailsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1">
                  <div className="p-4 space-y-4">
                    {/* Status Banner */}
                    <div className={`p-3 rounded-lg border ${getStatusInfo(selectedReservation.status).color}`}>
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {getStatusInfo(selectedReservation.status).icon}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {getStatusInfo(selectedReservation.status).label}
                          </p>
                          <p className="text-sm opacity-90">
                            {getStatusInfo(selectedReservation.status).description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Time Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>Start Time</span>
                        </div>
                        <p className="font-medium">
                          {format(new Date(selectedReservation.start_time), "MMM d, yyyy")}
                        </p>
                        {selectedReservation.is_full_day ? (
                          <Badge variant="outline" className="mt-1">Full Day</Badge>
                        ) : (
                          <p className="text-sm text-gray-400">
                            {format(new Date(selectedReservation.start_time), "h:mm a")}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>End Time</span>
                        </div>
                        <p className="font-medium">
                          {format(new Date(selectedReservation.end_time), "MMM d, yyyy")}
                        </p>
                        {!selectedReservation.is_full_day && (
                          <p className="text-sm text-gray-400">
                            {format(new Date(selectedReservation.end_time), "h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-2.5 text-sm">
                      <span className="font-medium">Duration:</span>{" "}
                      {getDuration(selectedReservation.start_time, selectedReservation.end_time, selectedReservation.is_full_day)}
                    </div>

                    <Separator className="bg-gray-800" />

                    {/* Location & Club Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>Space</span>
                        </div>
                        <p className="font-medium">
                          {selectedReservation.space_name || 'Unknown Space'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Building className="h-4 w-4" />
                          <span>Club</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={`/api/clubs/${selectedReservation.club_id}/image`}
                            alt={selectedReservation.club_name || 'Club logo'}
                            className="h-8 w-8 rounded-full object-cover bg-gray-900"
                            onError={(e) => {
                              e.currentTarget.src = '/default-club-image.png'
                            }}
                          />
                          <p className="font-medium">
                            {selectedReservation.club_name || 'Unknown Club'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedReservation.description && (
                      <>
                        <Separator className="bg-gray-800" />
                        <div className="space-y-1.5">
                          <h3 className="font-medium">Description</h3>
                          <p className="text-sm text-gray-400 whitespace-pre-line">
                            {selectedReservation.description}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="border-t border-gray-800 p-4 bg-[#0B1120] sticky bottom-0 z-20">
                  <div className="flex gap-3">
                    <Select 
                      value={reservationStatus} 
                      onValueChange={setReservationStatus}
                    >
                      <SelectTrigger className="flex-1 bg-gray-900 border-gray-800">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      className="px-8" 
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/reservations/${selectedReservation.id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: reservationStatus })
                          });
                          
                          if (!response.ok) throw new Error('Failed to update status');
                          
                          // Update local state
                          const updatedReservations = reservations.map(r => 
                            r.id === selectedReservation.id ? { ...r, status: reservationStatus } : r
                          );
                          setReservations(updatedReservations);
                          setSelectedReservation({ ...selectedReservation, status: reservationStatus });
                          
                        } catch (error) {
                          console.error('Error updating reservation:', error);
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
} 