"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, Users, Building, CheckCircle2, Clock3, AlertCircle, X, TableIcon, CalendarIcon, Search, ArrowUpDown, Filter, Eye } from "lucide-react"
import { BigCalendar } from "@/components/big-calendar"
import { Badge } from "@/components/ui/badge"
import { format, formatDistance, parseISO } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { AdminLayout } from "@/components/admin-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReservationDetails } from "@/components/reservation-details"
import { Input } from "@/components/ui/input"
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

type SortField = 'date' | 'club' | 'title' | 'time' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function AdminAllReservationsPage() {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [reservationStatus, setReservationStatus] = useState<string>("")
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [clubFilter, setClubFilter] = useState<string[]>([])
  const [uniqueClubs, setUniqueClubs] = useState<{id: string, name: string}[]>([])

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
      isFullDay: reservation.is_full_day
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

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ArrowUpDown className="ml-2 h-4 w-4 text-blue-500" /> 
      : <ArrowUpDown className="ml-2 h-4 w-4 text-blue-500 rotate-180" />;
  };

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
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reservations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {(statusFilter.length > 0 || clubFilter.length > 0) && (
                        <Badge variant="secondary" className="ml-1 rounded-full px-1 py-0 text-xs">
                          {statusFilter.length + clubFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['approved', 'pending', 'rejected'].map(status => (
                            <div key={status} className="flex items-center space-x-2">
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
                              />
                              <Label htmlFor={`status-${status}`} className="capitalize">
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium">Clubs</h4>
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                          {uniqueClubs.map(club => (
                            <div key={club.id} className="flex items-center space-x-2">
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
                              />
                              <Label htmlFor={`club-${club.id}`}>
                                {club.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setStatusFilter([]);
                            setClubFilter([]);
                          }}
                        >
                          Reset
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => document.body.click()} // Close popover
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="rounded-md border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading reservations...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  {error}
                </div>
              ) : filteredAndSortedReservations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No reservations found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Date
                          {getSortIcon('date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('club')}
                      >
                        <div className="flex items-center">
                          Club
                          {getSortIcon('club')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center">
                          Title
                          {getSortIcon('title')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('time')}
                      >
                        <div className="flex items-center">
                          Time
                          {getSortIcon('time')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center">
                          Created At
                          {getSortIcon('created_at')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedReservations.map((reservation: Reservation) => {
                      const startTime = new Date(reservation.start_time)
                      const endTime = new Date(reservation.end_time)
                      const createdAt = new Date(reservation.created_at)
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
                              <img
                                src={`/api/clubs/${reservation.club_id}/image`}
                                alt={reservation.club_name || 'Club logo'}
                                className="h-6 w-6 rounded-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, replace with default
                                  e.currentTarget.src = '/default-club-image.png'
                                }}
                              />
                              {reservation.club_name || 'Unknown Club'}
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
                            {format(createdAt, "MMM d, yyyy h:mm a")}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReservationSelect(reservation);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
              isFullDay: selectedReservation.is_full_day
            }}
            onClose={() => setIsDetailsOpen(false)}
            onStatusChange={async (newStatus) => {
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
            }}
          />
        )}
      </div>
    </AdminLayout>
  )
} 