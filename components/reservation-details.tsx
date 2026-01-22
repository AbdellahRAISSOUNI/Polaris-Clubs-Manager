"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { cn } from "@/lib/utils"
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
        <DialogContent className="p-0 overflow-hidden w-[100dvw] h-[100dvh] max-w-none rounded-none sm:rounded-3xl sm:h-[90vh] sm:max-h-[90vh] sm:max-w-[540px] [&>button.absolute.right-4.top-4]:hidden" style={{ maxHeight: '100dvh' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex h-full flex-col min-h-0" 
            style={{ height: '100%', maxHeight: '100%' }}
          >
            <DialogHeader className="shrink-0 p-5 sm:p-6 border-b border-white/10 dark:border-white/5 bg-gradient-to-r from-white/50 to-transparent dark:from-gray-900/50 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {reservation.clubLogo ? (
                    <div className="relative">
                      <img
                        src={reservation.clubLogo}
                        alt={reservation.clubName}
                        className="h-14 w-14 sm:h-12 sm:w-12 rounded-2xl object-cover ring-2 ring-white/30 dark:ring-gray-800/50 flex-shrink-0 shadow-apple"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-2 ring-white/30 dark:ring-gray-800/50 flex-shrink-0 shadow-apple backdrop-blur-sm" />
                  )}

                  <div className="min-w-0">
                    <DialogTitle className="text-xl sm:text-2xl font-semibold leading-tight line-clamp-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                      {reservation.title}
                    </DialogTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs sm:text-sm font-medium", statusPillClass)}>
                        {statusLabel}
                      </Badge>
                      <DialogDescription className="text-xs sm:text-sm text-muted-foreground truncate font-light">
                        {reservation.clubName}
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </DialogHeader>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-5 sm:mx-6 mt-4 sm:mt-5 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 sm:p-4 rounded-2xl text-xs sm:text-sm glass border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-5 sm:p-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch', height: '100%', maxHeight: '100%', overflowY: 'auto' }}>
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
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* When / Where */}
                <div className="rounded-3xl glass border-0 shadow-apple p-5 sm:p-6 backdrop-blur-xl">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Date</div>
                        <div className="text-base font-semibold">{reservation.date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                      </div>
                      <div className="text-right flex-1">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Time</div>
                        <div className="text-base font-semibold">
                          {reservation.isFullDay ? (
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs glass border-0">
                              Full Day
                            </Badge>
                          ) : (
                            reservation.time
                          )}
                        </div>
                      </div>
                    </div>

                    {reservation.location && (
                      <div className="pt-4 border-t border-white/10 dark:border-white/5">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Location</div>
                        <div className="text-base font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="break-words">{reservation.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin / Status message */}
                {reservation.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-3xl glass border-0 shadow-apple p-5 sm:p-6 backdrop-blur-xl"
                  >
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                      {status === "rejected" ? "Rejection Reason" : "Admin Message"}
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90">{reservation.message}</div>
                  </motion.div>
                )}

                {/* Decision (admin) */}
                {status === "pending" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-1">
                      Decision
                    </div>

                    {/* Shared message input */}
                    <div className="rounded-3xl glass border-0 shadow-apple p-5 sm:p-6 backdrop-blur-xl">
                      <Label htmlFor="decision-message" className="text-xs font-medium text-muted-foreground mb-3 block">
                        Message to the club (optional)
                      </Label>
                      <Textarea
                        id="decision-message"
                        placeholder="Add a note for the club (optional)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px] text-sm resize-none rounded-2xl glass border-0 shadow-apple bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm focus:bg-white dark:focus:bg-gray-900/70 transition-apple"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="button"
                          onClick={handleApprove}
                          disabled={isSubmitting}
                          className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Approving...
                            </>
                          ) : (
                            "Approve Reservation"
                          )}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleReject}
                          disabled={isSubmitting}
                          className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Rejecting...
                            </>
                          ) : (
                            "Reject Reservation"
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Danger zone */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-2xl text-red-600 dark:text-red-400 border-0 glass border-red-200/50 dark:border-red-800/50 hover:bg-red-50/80 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 shadow-apple hover:shadow-apple-lg transition-apple backdrop-blur-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete reservation
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[400px] p-5 sm:p-6 glass-strong border-0 rounded-3xl shadow-apple-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl font-semibold">Delete Reservation?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground mt-2">
              This action cannot be undone. This will permanently delete the reservation
              for "{reservation.title}" on {reservation.date.toLocaleDateString()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3 flex-col sm:flex-row mt-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <AlertDialogCancel disabled={isSubmitting} className="mt-0 text-xs sm:text-sm h-11 sm:h-11 rounded-2xl glass border-0 shadow-apple">Cancel</AlertDialogCancel>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-xs sm:text-sm h-11 sm:h-11 rounded-2xl border-0 shadow-apple hover:shadow-apple-lg transition-apple"
              >
                {isSubmitting ? "Deleting..." : "Delete Reservation"}
              </AlertDialogAction>
            </motion.div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

