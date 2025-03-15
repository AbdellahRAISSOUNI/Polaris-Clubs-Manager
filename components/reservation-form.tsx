"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, Info, MapPin, Users, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getClubId } from "@/lib/storage"
import { successNotification, errorNotification } from "@/lib/notifications"

interface Space {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  image: string;
}

interface ReservationFormProps {
  selectedDate?: Date
  onClose: () => void
}

export function ReservationForm({ selectedDate, onClose }: ReservationFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [isFullDay, setIsFullDay] = useState(false)
  const [venue, setVenue] = useState("")
  const [attendees, setAttendees] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState("weekly")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined)
  const [equipment, setEquipment] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true)

  // Fetch spaces from API
  useEffect(() => {
    const fetchSpaces = async () => {
      setIsLoadingSpaces(true)
      try {
        const response = await fetch('/api/spaces')
        if (!response.ok) throw new Error('Failed to fetch spaces')
        const data = await response.json()
        setSpaces(data)
      } catch (error: any) {
        console.error('Error fetching spaces:', error.message)
        setError("Failed to load venues. Please try again.")
      } finally {
        setIsLoadingSpaces(false)
      }
    }
    
    fetchSpaces()
  }, [])

  // Set start and end time to full day when isFullDay is toggled
  useEffect(() => {
    if (isFullDay) {
      setStartTime("00:00")
      setEndTime("23:59")
    } else {
      // Reset to default times if unchecked
      setStartTime("09:00")
      setEndTime("10:00")
    }
  }, [isFullDay])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate venue selection
      if (!venue) {
        setError("Please select a venue")
        errorNotification({ description: "Please select a venue" })
        setIsSubmitting(false)
        return
      }

      // Format the date and times for the API
      const startDateTime = new Date(date!)
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      startDateTime.setHours(startHours, startMinutes)

      const endDateTime = new Date(date!)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes)

      // Get the club ID from localStorage or context
      const clubId = getClubId()
      
      // Validate club ID
      if (!clubId) {
        setError("No club ID found. Please log in again.")
        errorNotification({ description: "No club ID found. Please log in again." })
        setIsSubmitting(false)
        return
      }
      
      // Log the data being sent for debugging
      const requestData = {
        spaceId: venue,
        clubId,
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isFullDay: isFullDay
      }
      console.log('Sending reservation data:', requestData)

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      // Log the raw response for debugging
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        const errorMessage = errorData.error || 'Failed to create reservation'
        setError(errorMessage)
        errorNotification({ description: errorMessage })
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log('Reservation created successfully:', responseData)
      
      // Show success notification
      successNotification({ 
        title: "Reservation Created", 
        description: `Your ${isFullDay ? 'full day ' : ''}reservation for "${title}" has been submitted successfully.` 
      })

      // Close the form after successful submission
      onClose()
    } catch (err) {
      console.error('Error creating reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create reservation'
      setError(errorMessage)
      errorNotification({ description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="max-h-[85vh] flex flex-col">
          <DialogHeader className="px-4 py-3 sm:p-6 border-b bg-white dark:bg-gray-950">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                New Reservation
              </DialogTitle>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DialogDescription className="text-xs sm:text-sm mt-1">
              Fill in the details for your reservation request
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 sm:p-6 space-y-4 sm:space-y-5">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium mb-1.5 block">
                    Event Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter event title"
                    className="h-10 sm:h-11"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date" className="text-sm font-medium mb-1.5 block">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 sm:h-11",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      id="full-day"
                      checked={isFullDay}
                      onCheckedChange={(checked) => setIsFullDay(checked === true)}
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <Label htmlFor="full-day" className="text-sm font-medium">
                      Full Day Reservation
                    </Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="startTime" className="text-sm font-medium mb-1.5 block">
                        Start Time <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startTime"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className={cn("pl-9 h-10 sm:h-11", isFullDay && "bg-muted")}
                          required
                          disabled={isFullDay}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-sm font-medium mb-1.5 block">
                        End Time <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endTime"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className={cn("pl-9 h-10 sm:h-11", isFullDay && "bg-muted")}
                          required
                          disabled={isFullDay}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="venue" className="text-sm font-medium mb-1.5 block">
                    Venue <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Select onValueChange={setVenue} required>
                      <SelectTrigger className="pl-9 h-10 sm:h-11">
                        <SelectValue placeholder={isLoadingSpaces ? "Loading venues..." : "Select a venue"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingSpaces ? (
                          <SelectItem value="loading" disabled>Loading venues...</SelectItem>
                        ) : spaces.length > 0 ? (
                          spaces.map((space) => (
                            <SelectItem key={space.id} value={space.id} className="py-2.5 sm:py-3">
                              {space.name} {space.capacity > 0 ? `(Capacity: ${space.capacity})` : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No venues available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="attendees" className="text-sm font-medium mb-1.5 block">
                    Expected Attendees <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="attendees"
                      type="number"
                      min="1"
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      placeholder="Number of attendees"
                      className="pl-9 h-10 sm:h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium mb-1.5 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any additional details about your event"
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Equipment Needed
                  </Label>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { id: "projector", label: "Projector" },
                      { id: "sound-system", label: "Sound System" },
                      { id: "chairs", label: "Extra Chairs" },
                      { id: "tables", label: "Extra Tables" }
                    ].map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          id={item.id}
                          checked={equipment.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEquipment([...equipment, item.id])
                            } else {
                              setEquipment(equipment.filter((eq) => eq !== item.id))
                            }
                          }}
                          className="h-4 w-4 sm:h-5 sm:w-5"
                        />
                        <Label htmlFor={item.id} className="text-sm">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-gray-50/80 dark:bg-gray-900/50 px-4 py-3 sm:px-6 sm:py-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 h-11"
            >
              {isSubmitting ? "Creating..." : "Create Reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

