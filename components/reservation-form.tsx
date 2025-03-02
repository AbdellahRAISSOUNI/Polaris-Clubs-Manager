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
import { Calendar, Clock, Info, MapPin, Users } from "lucide-react"
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Create New Reservation
            </DialogTitle>
            <DialogDescription>
              Fill in the details for your reservation request. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center gap-1">
                Event Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your event"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="full-day"
                checked={isFullDay}
                onCheckedChange={(checked) => setIsFullDay(checked === true)}
              />
              <Label htmlFor="full-day" className="flex items-center gap-1">
                Full Day Reservation
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Info className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <p className="text-sm">
                      Full day reservations will book the venue from 00:00 to 23:59. This is useful for events that require the venue for the entire day.
                    </p>
                  </PopoverContent>
                </Popover>
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="flex items-center gap-1">
                  Start Time <span className="text-red-500">*</span>
                  {isFullDay && <span className="text-xs text-muted-foreground ml-2">(Full day)</span>}
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={cn("pl-8", isFullDay && "bg-muted")}
                    required
                    disabled={isFullDay}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="flex items-center gap-1">
                  End Time <span className="text-red-500">*</span>
                  {isFullDay && <span className="text-xs text-muted-foreground ml-2">(Full day)</span>}
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn("pl-8", isFullDay && "bg-muted")}
                    required
                    disabled={isFullDay}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="venue" className="flex items-center gap-1">
                Venue <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Select onValueChange={setVenue} required>
                  <SelectTrigger className="pl-8">
                    <SelectValue placeholder={isLoadingSpaces ? "Loading venues..." : "Select a venue"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingSpaces ? (
                      <SelectItem value="loading" disabled>Loading venues...</SelectItem>
                    ) : spaces.length > 0 ? (
                      spaces.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
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

            <div className="grid gap-2">
              <Label htmlFor="attendees" className="flex items-center gap-1">
                Expected Attendees <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="attendees"
                  type="number"
                  min="1"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="Number of expected participants"
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <Label htmlFor="recurring" className="flex items-center gap-1">
                  Recurring Event
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Info className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <p className="text-sm">
                        Recurring events will create multiple reservations based on your selected pattern. All recurring
                        reservations must be approved by an administrator.
                      </p>
                    </PopoverContent>
                  </Popover>
                </Label>
              </div>

              {isRecurring && (
                <div className="pl-6 space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="recurrence-type">Recurrence Pattern</Label>
                    <RadioGroup
                      id="recurrence-type"
                      value={recurrenceType}
                      onValueChange={setRecurrenceType}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily">Daily</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly">Weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly">Monthly</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrence-end">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="recurrence-end"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !recurrenceEndDate && "text-muted-foreground",
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : <span>Pick an end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={setRecurrenceEndDate}
                          initialFocus
                          disabled={(date) => date < (selectedDate || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="equipment">Additional Equipment Needed</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="projector"
                    checked={equipment.includes("projector")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEquipment([...equipment, "projector"])
                      } else {
                        setEquipment(equipment.filter((item) => item !== "projector"))
                      }
                    }}
                  />
                  <Label htmlFor="projector">Projector</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sound-system"
                    checked={equipment.includes("sound-system")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEquipment([...equipment, "sound-system"])
                      } else {
                        setEquipment(equipment.filter((item) => item !== "sound-system"))
                      }
                    }}
                  />
                  <Label htmlFor="sound-system">Sound System</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="chairs"
                    checked={equipment.includes("chairs")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEquipment([...equipment, "chairs"])
                      } else {
                        setEquipment(equipment.filter((item) => item !== "chairs"))
                      }
                    }}
                  />
                  <Label htmlFor="chairs">Extra Chairs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tables"
                    checked={equipment.includes("tables")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEquipment([...equipment, "tables"])
                      } else {
                        setEquipment(equipment.filter((item) => item !== "tables"))
                      }
                    }}
                  />
                  <Label htmlFor="tables">Extra Tables</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about your event, special requirements, or any additional information"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

