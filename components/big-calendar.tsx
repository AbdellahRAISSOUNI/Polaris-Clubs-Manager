"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { addDays, addMonths, addWeeks, format, getDay, getDaysInMonth, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns"

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

interface Club {
  id: string;
  name: string;
  description: string;
  color?: number;
}

interface Space {
  id: string;
  name: string;
  capacity: number;
  description: string;
  is_active: boolean;
}

interface BigCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onReservationSelect?: (reservation: Reservation) => void;
}

export function BigCalendar({ 
  selectedDate, 
  onDateSelect, 
  onReservationSelect 
}: BigCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Enhanced club colors with better contrast and visual appeal
  const clubColors = [
    { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700", hover: "hover:bg-blue-200 dark:hover:bg-blue-800/50" },
    { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700", hover: "hover:bg-emerald-200 dark:hover:bg-emerald-800/50" },
    { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700", hover: "hover:bg-purple-200 dark:hover:bg-purple-800/50" },
    { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700", hover: "hover:bg-amber-200 dark:hover:bg-amber-800/50" },
    { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-800 dark:text-pink-300", border: "border-pink-300 dark:border-pink-700", hover: "hover:bg-pink-200 dark:hover:bg-pink-800/50" },
    { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-800 dark:text-indigo-300", border: "border-indigo-300 dark:border-indigo-700", hover: "hover:bg-indigo-200 dark:hover:bg-indigo-800/50" },
    { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-800 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700", hover: "hover:bg-rose-200 dark:hover:bg-rose-800/50" },
    { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700", hover: "hover:bg-orange-200 dark:hover:bg-orange-800/50" },
    { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-800 dark:text-teal-300", border: "border-teal-300 dark:border-teal-700", hover: "hover:bg-teal-200 dark:hover:bg-teal-800/50" },
    { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-800 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700", hover: "hover:bg-cyan-200 dark:hover:bg-cyan-800/50" }
  ]

  // Status colors
  const statusColors = {
    approved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300", border: "border-green-300 dark:border-green-700" },
    pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700" },
    rejected: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300", border: "border-red-300 dark:border-red-700" }
  }

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch reservations
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
        
        if (reservationsError) throw reservationsError
        
        // Fetch clubs
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('*')
        
        if (clubsError) throw clubsError
        
        // Fetch spaces
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select('*')
        
        if (spacesError) throw spacesError
        
        // Assign club names and colors to reservations
        const enhancedReservations = reservationsData.map((reservation: Reservation) => {
          const club = clubsData.find((c: Club) => c.id === reservation.club_id)
          const space = spacesData.find((s: Space) => s.id === reservation.space_id)
          
          return {
            ...reservation,
            club_name: club?.name || 'Unknown Club',
            space_name: space?.name || 'Unknown Space'
          }
        })
        
        // Assign colors to clubs
        const enhancedClubs = clubsData.map((club: Club, index: number) => ({
          ...club,
          color: index % clubColors.length
        }))
        
        setReservations(enhancedReservations)
        setClubs(enhancedClubs)
        setSpaces(spacesData)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError('Failed to load calendar data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Calendar navigation functions
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Get club color by club ID
  const getClubColor = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId)
    return club ? clubColors[club.color as unknown as number] : clubColors[0]
  }

  // Get status color
  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-300", border: "border-gray-300 dark:border-gray-700" }
  }

  // Format time for display
  const formatTime = (timeString: string, reservation?: Reservation) => {
    // If this is a full day reservation, return "Full Day" instead of the time
    if (reservation?.is_full_day) {
      return "Full Day"
    }
    
    const date = new Date(timeString)
    return format(date, 'h:mm a')
  }

  // Get reservations for a specific day
  const getReservationsForDay = (day: Date) => {
    return reservations.filter(res => {
      const resDate = new Date(res.start_time)
      return isSameDay(resDate, day)
    })
  }

  // Render days of the month
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const daysInMonth = getDaysInMonth(currentDate)
    
    // Create array of week rows
    const weeks = []
    let days = []
    let day = startDate
    
    // Create header row with day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Generate calendar grid
    for (let i = 0; i < 42; i++) {
      const formattedDate = format(day, 'd')
      const isCurrentMonth = isSameMonth(day, currentDate)
      const isToday = isSameDay(day, new Date())
      const dayReservations = getReservationsForDay(day)
      
      days.push(
        <div 
          key={day.toString()} 
          className={`min-h-[120px] p-2 border ${
            isCurrentMonth 
              ? 'bg-white dark:bg-gray-950' 
              : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
          } ${
            isToday 
              ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset' 
              : ''
          } hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors`}
          onClick={() => onDateSelect && onDateSelect(day)}
        >
          <div className={`text-right mb-2 font-medium ${
            isToday 
              ? 'text-blue-600 dark:text-blue-400' 
              : ''
          }`}>
            {formattedDate}
          </div>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[90px] pr-1">
            {dayReservations.slice(0, 3).map(reservation => {
              const clubColor = getClubColor(reservation.club_id)
              const statusColor = getStatusColor(reservation.status)
              
              return (
                <TooltipProvider key={reservation.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`text-xs p-1.5 rounded-md border ${clubColor.bg} ${clubColor.text} ${clubColor.border} ${clubColor.hover} transition-colors cursor-pointer shadow-sm`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onReservationSelect && onReservationSelect(reservation)
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1">
                            <img
                              src={`/api/clubs/${reservation.club_id}/image`}
                              alt={reservation.club_name || 'Club logo'}
                              className="h-4 w-4 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-club-image.png'
                              }}
                            />
                            <span className="font-medium truncate">{reservation.title}</span>
                          </div>
                          <div className={`h-3 w-3 rounded-full ${
                            reservation.status === 'approved' ? 'bg-green-500' :
                            reservation.status === 'pending' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                        </div>
                        <div className="text-xs opacity-80 mt-0.5">{formatTime(reservation.start_time, reservation)}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">{reservation.title}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className={`${statusColor.bg} ${statusColor.text}`}>
                            {reservation.status}
                          </Badge>
                          <span>•</span>
                          <span>{reservation.space_name}</span>
                        </div>
                        <p className="text-xs">
                          {reservation.is_full_day 
                            ? "Full Day" 
                            : `${format(new Date(reservation.start_time), 'h:mm a')} - ${format(new Date(reservation.end_time), 'h:mm a')}`}
                        </p>
                        <Badge variant="outline" className={`${clubColor.bg} ${clubColor.text}`}>
                          {reservation.club_name}
                        </Badge>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
            
            {dayReservations.length > 3 && (
              <div className="text-xs text-center py-1 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onDateSelect && onDateSelect(day)
                }}>
                +{dayReservations.length - 3} more
              </div>
            )}
          </div>
        </div>
      )
      
      if ((i + 1) % 7 === 0) {
        weeks.push(
          <div key={day.toString()} className="grid grid-cols-7">
            {days}
          </div>
        )
        days = []
      }
      
      day = addDays(day, 1)
    }
    
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-7 text-center py-2 border-b font-medium bg-gray-50 dark:bg-gray-900 rounded-t-md">
          {dayNames.map(name => (
            <div key={name} className="py-1">{name}</div>
          ))}
        </div>
        <div className="space-y-1 rounded-b-md overflow-hidden border border-t-0">
          {weeks}
        </div>
      </div>
    )
  }

  // Render days of the week
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dayName = format(day, 'EEE')
      const dayNumber = format(day, 'd')
      const isToday = isSameDay(day, new Date())
      const dayReservations = getReservationsForDay(day)
      
      // Mobile view: Stack days vertically
      days.push(
        <div key={`day-${i}`} className={`
          md:border-r md:last:border-r-0 
          border-b last:border-b-0 md:border-b-0
          ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}
        `}>
          {/* Day header - Always visible */}
          <div className={`
            flex md:block items-center justify-between 
            border-b md:border-b-0 
            p-3 md:p-2 
            sticky md:static top-0 
            bg-gray-50 dark:bg-gray-900 md:bg-transparent
            z-10
            ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
          `}>
            <div className="flex md:block items-baseline gap-2 md:gap-0 md:text-center">
              <div className="text-sm font-medium opacity-80">{dayName}</div>
              <div className="text-xl font-semibold md:mt-0.5">{dayNumber}</div>
            </div>
            {/* Show reservation count on mobile */}
            {dayReservations.length > 0 && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 md:hidden">
                {dayReservations.length} {dayReservations.length === 1 ? 'reservation' : 'reservations'}
              </div>
            )}
          </div>

          {/* Reservations */}
          <div className="p-2 space-y-2 min-h-[100px] md:min-h-[400px]">
            {dayReservations.map(reservation => {
              const clubColor = getClubColor(reservation.club_id)
              const statusColor = getStatusColor(reservation.status)
              
              return (
                <TooltipProvider key={reservation.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`
                          p-2.5 rounded-md border shadow-sm 
                          ${clubColor.bg} ${clubColor.text} ${clubColor.border} ${clubColor.hover} 
                          transition-colors cursor-pointer text-sm
                        `}
                        onClick={() => onReservationSelect && onReservationSelect(reservation)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <img
                              src={`/api/clubs/${reservation.club_id}/image`}
                              alt={reservation.club_name || 'Club logo'}
                              className="h-5 w-5 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-club-image.png'
                              }}
                            />
                            <div className="font-medium truncate">
                              {reservation.title || 'Untitled'}
                            </div>
                          </div>
                          <div className={`h-4 w-4 rounded-full ${
                            reservation.status === 'approved' ? 'bg-green-500' :
                            reservation.status === 'pending' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                        </div>
                        <div className="mt-1.5 text-xs space-y-1 opacity-90">
                          <div className="font-medium">
                            {reservation.is_full_day 
                              ? "Full Day" 
                              : `${formatTime(reservation.start_time, reservation)} - ${formatTime(reservation.end_time, reservation)}`}
                          </div>
                          <div className="truncate">{reservation.space_name || 'No location'}</div>
                          <div className="truncate opacity-75">{reservation.club_name || 'Unknown Club'}</div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="p-3 max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold">{reservation.title}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className={`${statusColor.bg} ${statusColor.text}`}>
                            {reservation.status}
                          </Badge>
                          <span>•</span>
                          <span>{reservation.space_name}</span>
                        </div>
                        <p className="text-xs">
                          {reservation.is_full_day 
                            ? "Full Day" 
                            : `${format(new Date(reservation.start_time), 'h:mm a')} - ${format(new Date(reservation.end_time), 'h:mm a')}`}
                        </p>
                        <Badge variant="outline" className={`${clubColor.bg} ${clubColor.text}`}>
                          {reservation.club_name}
                        </Badge>
                        {reservation.description && (
                          <p className="text-xs border-t pt-1 mt-1">{reservation.description}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
            {dayReservations.length === 0 && (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No reservations
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div className="border rounded-md overflow-hidden">
        {/* Desktop view: Grid */}
        <div className="hidden md:grid md:grid-cols-7">
          {days}
        </div>
        {/* Mobile view: Stack */}
        <div className="md:hidden flex flex-col">
          {days}
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-md">
      <CardContent className="p-2 sm:p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={viewMode === 'month' ? prevMonth : prevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-lg sm:text-xl font-semibold">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
            </h2>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={viewMode === 'month' ? nextMonth : nextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="ml-2 hidden sm:flex"
            >
              Today
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant={viewMode === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('month')}
              className="flex-1 sm:flex-none"
            >
              Month
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('week')}
              className="flex-1 sm:flex-none"
            >
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="flex-1 sm:hidden"
            >
              Today
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            {error}
          </div>
        ) : (
          viewMode === 'month' ? renderMonthView() : renderWeekView()
        )}
        
        {clubs.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Info className="h-4 w-4" />
              Club Color Legend
            </h3>
            <div className="flex flex-wrap gap-2">
              {clubs.map(club => {
                const colorIndex = club.color as unknown as number;
                const color = clubColors[colorIndex];
                return (
                  <Badge key={club.id} className={`${color.bg} ${color.text} ${color.border}`}>
                    {club.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
            <Info className="h-4 w-4" />
            Status Legend
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusColors).map(([status, color]) => (
              <Badge key={status} className={`${color.bg} ${color.text} ${color.border}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 