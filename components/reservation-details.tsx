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
  }
  onClose: () => void
  onStatusChange?: (status: string) => void
}

export function ReservationDetails({ reservation, onClose, onStatusChange }: ReservationDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(reservation.title)
  const [time, setTime] = useState(reservation.time)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleApprove = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved'
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve reservation')
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
      errorNotification({ description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          reason: reason // You'll need to add this field to your API
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject reservation')
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
      errorNotification({ description: errorMessage })
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Reservation Details</span>
              <Badge
                variant={
                  reservation.status === "approved"
                    ? "default"
                    : reservation.status === "rejected"
                      ? "destructive"
                      : "outline"
                }
              >
                {reservation.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>Review and manage this reservation request</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            {isEditing ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Event Title</Label>
                  <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g., 14:00-16:00"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Club</p>
                    <div className="flex items-center gap-2 mt-1">
                      {reservation.clubLogo && (
                        <img 
                          src={reservation.clubLogo} 
                          alt={reservation.clubName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <p className="text-sm text-muted-foreground">{reservation.clubName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">{reservation.date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.isFullDay ? (
                        <Badge variant="outline" className="font-normal">Full Day</Badge>
                      ) : (
                        reservation.time
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Event Title</p>
                  <p className="text-sm">{reservation.title}</p>
                </div>
              </>
            )}

            {reservation.status === "pending" && !isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="reason">Rejection Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason if rejecting this reservation"
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="sm:mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Close
                </Button>

                {reservation.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Rejecting..." : "Reject"}
                    </Button>
                    <Button onClick={handleApprove} disabled={isSubmitting}>
                      {isSubmitting ? "Approving..." : "Approve"}
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reservation
              for "{reservation.title}" on {reservation.date.toLocaleDateString()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Deleting..." : "Delete Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

