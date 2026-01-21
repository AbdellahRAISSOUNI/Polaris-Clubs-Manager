"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { successNotification, errorNotification } from "@/lib/notifications"
import { Trash2, X } from "lucide-react"
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
import { MapPin } from "lucide-react"

interface ReservationDetailsProps {
  reservation: {
    id: string;
    title: string;
    status: string;
    date: Date;
    time: string;
    clubName: string;
    clubLogo?: string;
    isFullDay?: boolean;
    message?: string;
    location?: string;
  }
  onClose: () => void
  onStatusChange?: (status: string) => void
}

export function ReservationDetails({ reservation, onClose, onStatusChange }: ReservationDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(reservation.title)
  const [time, setTime] = useState(reservation.time)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const status = (reservation.status || "").toLowerCase()
  const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"
  const statusPillClass =
    status === "approved"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700"
      : status === "pending"
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
        : status === "rejected"
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700"

  const handleApprove = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      console.log('Approving reservation:', reservation.id);
      const response = await fetch(`/api/reservations/${reservation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status: 'approved',
          message: message.trim() || undefined
        }),
      })
      
      console.log('Approval response status:', response.status);
      const responseData = await response.json();
      console.log('Approval response data:', responseData);
      
      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to approve reservation';
        console.error('Error response:', responseData);
        throw new Error(errorMessage);
      }
      
      successNotification({
        title: "Reservation Approved",
        description: `The reservation for "${reservation.title}" has been approved successfully.`
      })
      
      // Call the onStatusChange callback to refresh the parent component
      if (onStatusChange) {
        onStatusChange('approved')
      }
      
      onClose()
    } catch (err) {
      console.error('Error approving reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve reservation'
      setError(errorMessage)
      errorNotification({ 
        title: "Error Approving Reservation",
        description: errorMessage 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      console.log('Rejecting reservation:', reservation.id);
      const response = await fetch(`/api/reservations/${reservation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status: 'rejected',
          message: message.trim() || undefined
        }),
      })
      
      console.log('Rejection response status:', response.status);
      const responseData = await response.json();
      console.log('Rejection response data:', responseData);
      
      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to reject reservation';
        console.error('Error response:', responseData);
        throw new Error(errorMessage);
      }
      
      errorNotification({
        title: "Reservation Rejected",
        description: `The reservation for "${reservation.title}" has been rejected.`
      })
      
      // Call the onStatusChange callback to refresh the parent component
      if (onStatusChange) {
        onStatusChange('rejected')
      }
      
      onClose()
    } catch (err) {
      console.error('Error rejecting reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject reservation'
      setError(errorMessage)
      errorNotification({ 
        title: "Error Rejecting Reservation",
        description: errorMessage 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete reservation')
      }
      
      successNotification({
        title: "Reservation Deleted",
        description: `The reservation for "${reservation.title}" has been deleted successfully.`
      })
      
      // Call the onStatusChange callback to refresh the parent component
      if (onStatusChange) {
        onStatusChange('deleted')
      }
      
      onClose()
    } catch (err) {
      console.error('Error deleting reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete reservation'
      setError(errorMessage)
      errorNotification({ description: errorMessage })
    } finally {
      setIsSubmitting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSaveChanges = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // This would require an additional API endpoint to update reservation details
      // For now, we'll just simulate success
      console.log("Updating reservation:", reservation.id, { title, time })
      
      successNotification({
        title: "Reservation Updated",
        description: "The reservation details have been updated successfully."
      })
      
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating reservation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reservation'
      setError(errorMessage)
      errorNotification({ description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="p-0 overflow-hidden w-[100dvw] h-[100dvh] max-w-none rounded-none sm:rounded-lg sm:h-[90vh] sm:max-h-[90vh] sm:max-w-[540px] [&>button.absolute.right-4.top-4]:hidden" style={{ maxHeight: '100dvh' }}>
          <div className="flex h-full flex-col min-h-0" style={{ height: '100%', maxHeight: '100%' }}>
            <DialogHeader className="shrink-0 p-4 sm:p-6 border-b bg-background">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {reservation.clubLogo ? (
                    <img
                      src={reservation.clubLogo}
                      alt={reservation.clubName}
                      className="h-12 w-12 sm:h-11 sm:w-11 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-800 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 sm:h-11 sm:w-11 rounded-full bg-muted ring-1 ring-gray-200 dark:ring-gray-800 flex-shrink-0" />
                  )}

                  <div className="min-w-0">
                    <DialogTitle className="text-lg sm:text-xl leading-tight line-clamp-2">
                      {reservation.title}
                    </DialogTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs sm:text-sm ${statusPillClass}`}>
                        {statusLabel}
                      </Badge>
                      <DialogDescription className="text-xs sm:text-sm text-muted-foreground truncate">
                        {reservation.clubName}
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-9 sm:w-9"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

          {error && (
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 sm:p-3 rounded-md text-xs sm:text-sm">
              {error}
            </div>
          )}

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-6 pb-6" style={{ WebkitOverflowScrolling: 'touch', height: '100%', maxHeight: '100%', overflowY: 'auto' }}>
            {isEditing ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="edit-title" className="text-xs sm:text-sm">Event Title</Label>
                  <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  <Label htmlFor="edit-time" className="text-xs sm:text-sm">Time</Label>
                  <Input
                    id="edit-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g., 14:00-16:00"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* When / Where */}
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Date</div>
                        <div className="mt-1 text-sm font-medium">{reservation.date.toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Time</div>
                        <div className="mt-1 text-sm font-medium">
                          {reservation.isFullDay ? (
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                              Full Day
                            </Badge>
                          ) : (
                            reservation.time
                          )}
                        </div>
                      </div>
                    </div>

                    {reservation.location && (
                      <div className="pt-3 border-t">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Location</div>
                        <div className="mt-1 text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="break-words">{reservation.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin / Status message */}
                {reservation.message && (
                  <div className="rounded-2xl border p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      {status === "rejected" ? "Rejection Reason" : "Admin Message"}
                    </div>
                    <div className="mt-2 text-sm leading-relaxed">{reservation.message}</div>
                  </div>
                )}

                {/* Decision (admin) */}
                {status === "pending" && (
                  <div className="space-y-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-1">
                      Decision
                    </div>

                    {/* Shared message input */}
                    <div className="rounded-2xl border p-4">
                      <Label htmlFor="decision-message" className="text-xs font-medium text-muted-foreground">
                        Message to the club (optional)
                      </Label>
                      <Textarea
                        id="decision-message"
                        placeholder="Add a note for the club (optional)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-2 min-h-[100px] text-sm resize-none"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                      <Button
                        type="button"
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSubmitting ? "Approving..." : "Approve Reservation"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isSubmitting}
                        className="w-full h-12 text-base font-semibold"
                      >
                        {isSubmitting ? "Rejecting..." : "Reject Reservation"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Danger zone */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting}
                    className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete reservation
                  </Button>
                </div>
              </div>
            )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[400px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Reservation?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This action cannot be undone. This will permanently delete the reservation
              for "{reservation.title}" on {reservation.date.toLocaleDateString()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isSubmitting} className="mt-0 text-xs sm:text-sm h-8 sm:h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm h-8 sm:h-10"
            >
              {isSubmitting ? "Deleting..." : "Delete Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

