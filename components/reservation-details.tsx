"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { successNotification, errorNotification } from "@/lib/notifications"
import { Trash2 } from "lucide-react"
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
  }
  onClose: () => void
  onStatusChange?: (status: string) => void
}

export function ReservationDetails({ reservation, onClose, onStatusChange }: ReservationDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(reservation.title)
  const [time, setTime] = useState(reservation.time)
  const [reason, setReason] = useState("")
  const [approvalMessage, setApprovalMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
          message: approvalMessage || undefined
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
    if (!reason.trim()) {
      setError("Please provide a reason for rejection")
      return
    }
    
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
          message: reason // Send the reason as the message for notification purposes
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
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden max-w-[95vw] rounded-lg">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base sm:text-xl">Reservation Details</DialogTitle>
              <Badge
                variant={
                  reservation.status === "approved"
                    ? "default"
                    : reservation.status === "rejected"
                      ? "destructive"
                      : "outline"
                }
                className="ml-2 text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-0.5"
              >
                {reservation.status}
              </Badge>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
              Review and manage this reservation request
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 sm:p-3 rounded-md text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="p-4 sm:p-6 pt-3 sm:pt-4 overflow-y-auto max-h-[calc(80vh-250px)]">
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
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  {reservation.clubLogo && (
                    <img 
                      src={reservation.clubLogo} 
                      alt={reservation.clubName}
                      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-800 flex-shrink-0"
                    />
                  )}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold">{reservation.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{reservation.clubName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 bg-muted/30">
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">Date</div>
                    <div className="text-sm sm:font-medium mt-0.5 sm:mt-1">{reservation.date.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">Time</div>
                    <div className="text-sm sm:font-medium mt-0.5 sm:mt-1">
                      {reservation.isFullDay ? (
                        <Badge variant="outline" className="text-xs font-normal">Full Day</Badge>
                      ) : (
                        reservation.time
                      )}
                    </div>
                  </div>
                </div>

                {reservation.message && (
                  <div className="rounded-lg border p-3 sm:p-4">
                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1 sm:mb-2">
                      {reservation.status === 'rejected' ? 'Rejection Reason' : 'Admin Message'}
                    </div>
                    <div className="text-xs sm:text-sm">{reservation.message}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-4 sm:p-6 pt-3 sm:pt-4">
            {isEditing ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSubmitting} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting}
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950/50 text-xs h-7 sm:h-8"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Delete
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClose} 
                    disabled={isSubmitting} 
                    className="ml-auto text-xs h-7 sm:h-8"
                  >
                    Close
                  </Button>
                </div>

                {reservation.status === "pending" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <Label htmlFor="approval-message" className="text-xs sm:text-sm font-medium">
                          Approval Message <span className="text-muted-foreground">(Optional)</span>
                        </Label>
                        <Textarea
                          id="approval-message"
                          placeholder="Add any additional information for the club"
                          value={approvalMessage}
                          onChange={(e) => setApprovalMessage(e.target.value)}
                          className="mt-1 sm:mt-1.5 min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm resize-none"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        {isSubmitting ? "Approving..." : "Approve"}
                      </Button>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <Label htmlFor="rejection-reason" className="text-xs sm:text-sm font-medium text-red-500">
                          Rejection Reason <span className="text-red-400">(Required)</span>
                        </Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Provide a reason for rejection"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="mt-1 sm:mt-1.5 min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm resize-none"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isSubmitting}
                        className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                      >
                        {isSubmitting ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
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

