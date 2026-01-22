"use client"

import { useNotifications } from '@/lib/notifications-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow, format } from 'date-fns'
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, MailOpen, Trash2, Filter, CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCurrentPeriod, getPreviousPeriod, type TimePeriod } from '@/lib/time-periods-client'
import { getAdminId, getClubId } from '@/lib/storage'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination } from "@/components/ui/pagination"
import { motion, AnimatePresence } from "framer-motion"

const NotificationIcon = ({ type, senderId }: { type: string, senderId?: string }) => {
  if (senderId) {
    return (
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
        <AvatarImage 
          src={`/api/clubs/${senderId}/image`}
          alt="Club logo"
        />
        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          C
        </AvatarFallback>
      </Avatar>
    )
  }

  switch (type) {
    case 'success':
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
        </div>
      )
    case 'error':
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
        </div>
      )
    case 'warning':
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
      )
    case 'info':
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
        </div>
      )
    default:
      return (
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-800">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
        </div>
      )
  }
}

export function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, refreshNotifications, deleteNotification, deleteAllNotifications } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [periodScope, setPeriodScope] = useState<"all" | "mandate" | "academicYear">("mandate")
  const [periodMode, setPeriodMode] = useState<"current" | "previous" | "specific">("current")
  const [specificPeriodId, setSpecificPeriodId] = useState<string>("")
  const [mandates, setMandates] = useState<TimePeriod[]>([])
  const [academicYears, setAcademicYears] = useState<TimePeriod[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Fetch time periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const [mandatesRes, yearsRes] = await Promise.all([
          fetch("/api/time-periods?type=mandate"),
          fetch("/api/time-periods?type=academicYear")
        ])
        const mandatesData = mandatesRes.ok ? await mandatesRes.json() : []
        const yearsData = yearsRes.ok ? await yearsRes.json() : []
        setMandates(mandatesData || [])
        setAcademicYears(yearsData || [])
        
        // Set default to current mandate
        const currentMandate = getCurrentPeriod(mandatesData || [])
        if (currentMandate) {
          setPeriodScope("mandate")
          setPeriodMode("current")
          setSpecificPeriodId(currentMandate.id || "")
        }
      } catch (error) {
        console.error("Error fetching time periods:", error)
      }
    }
    fetchPeriods()
  }, [])
  
  // Keep filter and tab selection in sync
  useEffect(() => {
    setFilter(activeTab)
    setCurrentPage(1) // Reset to page 1 when filter changes
  }, [activeTab])
  
  // Reset to page 1 when period filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [periodScope, periodMode, specificPeriodId])
  
  // Calculate active period date range
  const activePeriods = periodScope === "mandate" ? mandates : academicYears
  const currentPeriod = periodScope === "all" ? null : getCurrentPeriod(activePeriods)
  const previousPeriod = periodScope === "all" ? null : getPreviousPeriod(activePeriods, currentPeriod)
  const activePeriodId =
    periodScope === "all"
      ? null
      : periodMode === "current"
        ? currentPeriod?.id || null
        : periodMode === "previous"
          ? previousPeriod?.id || null
          : specificPeriodId || null
  
  const activePeriod = activePeriods.find(p => p.id === activePeriodId)
  const periodStartDate = activePeriod ? new Date(activePeriod.start_date) : null
  const periodEndDate = activePeriod ? new Date(activePeriod.end_date) : null
  
  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
  }

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId)
    setNotificationToDelete(null)
  }

  const handleDeleteAllNotifications = async () => {
    await deleteAllNotifications()
    setIsDeleteAllDialogOpen(false)
  }

  // Bulk action handlers
  const handleBulkNotificationAction = async (action: 'markRead' | 'markUnread' | 'delete') => {
    if (selectedNotifications.size === 0) return

    setIsBulkActionLoading(true)
    try {
      const adminId = getAdminId()
      const clubId = getClubId()
      const userId = adminId || clubId
      const userType = adminId ? 'admin' : 'club'

      if (!userId || !userType) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/notifications/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-type': userType,
        },
        body: JSON.stringify({
          notificationIds: Array.from(selectedNotifications),
          action,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform bulk action')
      }

      const result = await response.json()
      
      // Show success notification
      const { successNotification } = await import('@/lib/notifications')
      successNotification({
        title: "Bulk Action Successful",
        description: result.message || `Successfully processed ${selectedNotifications.size} notification(s)`
      })

      // Clear selection and refresh
      setSelectedNotifications(new Set())
      await refreshNotifications()
    } catch (error: any) {
      console.error('Error performing bulk action:', error)
      const { errorNotification } = await import('@/lib/notifications')
      errorNotification({
        title: "Bulk Action Failed",
        description: error.message || 'Failed to perform bulk action'
      })
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  const toggleSelectAllNotifications = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read/unread status
    if (filter === 'unread' && notification.is_read) return false
    if (filter === 'read' && !notification.is_read) return false
    
    // Filter by period date range
    if (periodScope !== "all" && periodStartDate && periodEndDate) {
      const notificationDate = new Date(notification.created_at)
      if (notificationDate < periodStartDate || notificationDate > periodEndDate) {
        return false
      }
    }
    
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length
  const readCount = notifications.filter(n => n.is_read).length
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex)

  // Format message with proper line breaks
  const formatMessage = (message: string) => {
    return message.split('\n\n').map((paragraph, i) => (
      <p key={i} className="mt-1">
        {paragraph}
      </p>
    ))
  }

  // Render notification list
  const renderNotificationList = () => {
    if (filteredNotifications.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 sm:px-0"
        >
          <Card className="p-6 sm:p-8 text-center glass shadow-apple border-0 rounded-3xl">
            <Bell className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-gray-400" />
            <p className="text-base sm:text-lg font-medium">No notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filter === 'all' 
                ? "You don't have any notifications yet" 
                : filter === 'unread' 
                  ? "You don't have any unread notifications" 
                  : "You don't have any read notifications"}
            </p>
          </Card>
        </motion.div>
      )
    }
    
    return (
      <div className="space-y-3 sm:space-y-4 px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {paginatedNotifications.map((notification, index) => {
          const isSelected = selectedNotifications.has(notification.id)
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className={`glass shadow-apple border-0 rounded-3xl transition-apple overflow-hidden ${
                  !notification.is_read 
                    ? 'ring-2 ring-blue-500/30 dark:ring-blue-400/30' 
                    : ''
                } ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''} hover:shadow-apple-lg`}
              >
              <div className="p-3 sm:p-4 md:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleNotificationSelection(notification.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <NotificationIcon type={notification.type} senderId={notification.sender_id} />
                  <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <h3 className={`font-semibold text-base sm:text-lg ${!notification.is_read ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={notification.is_read ? "outline" : "secondary"}
                        className="whitespace-nowrap text-xs glass border-0 shadow-apple"
                      >
                        {notification.is_read ? 'Read' : 'New'}
                      </Badge>
                      <time className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </time>
                    </div>
                  </div>
                  
                  <div className={`mt-1.5 sm:mt-2 text-sm ${!notification.is_read ? 'text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                    {formatMessage(notification.message)}
                  </div>
                  
                  <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      {format(new Date(notification.created_at), 'MMM d, yyyy • h:mm a')}
                    </div>
                    <div className="flex-1"></div>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View details
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Link>
                    )}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {!notification.is_read && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs h-7 sm:h-8 flex-1 sm:flex-auto rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                          >
                            <MailOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Mark as read
                          </Button>
                        </motion.div>
                      )}
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNotificationToDelete(notification.id)}
                          className="text-xs h-7 sm:h-8 text-red-500 hover:text-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/30 flex-1 sm:flex-auto rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Delete
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </motion.div>
          )
        })}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-8 sm:pb-12 overflow-x-hidden">
      <div className="w-full sm:container sm:mx-auto py-4 sm:py-8 px-0 sm:px-4 md:px-6 lg:px-8 sm:max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6 px-4 sm:px-0"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Stay updated with important information
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-sm h-9 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple">
                    <Filter className="h-4 w-4" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="text-sm glass-strong border-0 shadow-apple-lg rounded-2xl">
                  <DropdownMenuItem onClick={() => { setFilter('all'); setActiveTab('all'); }} className="rounded-xl">
                    All notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setFilter('unread'); setActiveTab('unread'); }} className="rounded-xl">
                    Unread only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setFilter('read'); setActiveTab('read'); }} className="rounded-xl">
                    Read only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 text-sm h-9 rounded-2xl border-0 shadow-apple hover:shadow-apple-lg transition-apple ${
                  showFilters 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' 
                    : 'glass'
                }`}
                title="Time Period Filters"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Period</span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={refreshNotifications} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1.5 text-sm h-9 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
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
            </motion.div>
            
            {unreadCount > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={markAllAsRead} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1.5 text-sm h-9 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                >
                  <MailOpen className="h-4 w-4" />
                  Mark all as read
                </Button>
              </motion.div>
            )}
            
            {notifications.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  onClick={() => setIsDeleteAllDialogOpen(true)} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1.5 text-sm h-9 rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple text-red-500 hover:text-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete all
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedNotifications.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl glass border-0 shadow-apple-lg p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 mx-4 sm:mx-0"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="secondary" className="text-xs sm:text-sm glass border-0 shadow-apple">
                {selectedNotifications.size} selected
              </Badge>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotifications(new Set())}
                  className="h-7 sm:h-8 text-xs rounded-2xl"
                >
                  Clear
                </Button>
              </motion.div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkNotificationAction('markRead')}
                  disabled={isBulkActionLoading}
                  className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                >
                  {isBulkActionLoading ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                  ) : (
                    <MailOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Mark as read
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkNotificationAction('markUnread')}
                  disabled={isBulkActionLoading}
                  className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                >
                  {isBulkActionLoading ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                  ) : (
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Mark as unread
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedNotifications.size} notification(s)? This action cannot be undone.`)) {
                      handleBulkNotificationAction('delete')
                    }
                  }}
                  disabled={isBulkActionLoading}
                  className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                >
                  {isBulkActionLoading ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                  ) : (
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Delete
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Period filter - Collapsible */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mb-4 sm:mb-6 overflow-hidden mx-4 sm:mx-0"
          >
            <Card className="glass shadow-apple border-0 rounded-3xl">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs">Scope</Label>
                    <Select
                      value={periodScope}
                      onValueChange={(value) => {
                        const nextScope = value as "all" | "mandate" | "academicYear"
                        setPeriodScope(nextScope)
                        setPeriodMode(nextScope === "all" ? "current" : "current")
                        if (nextScope === "mandate") {
                          setSpecificPeriodId(getCurrentPeriod(mandates)?.id || mandates?.[0]?.id || "")
                        } else if (nextScope === "academicYear") {
                          setSpecificPeriodId(getCurrentPeriod(academicYears)?.id || academicYears?.[0]?.id || "")
                        } else {
                          setSpecificPeriodId("")
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1 h-10 text-xs rounded-2xl glass border-0 shadow-apple">
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent className="glass-strong border-0 shadow-apple-lg rounded-2xl">
                        <SelectItem value="mandate" className="rounded-xl">Mandat ADE</SelectItem>
                        <SelectItem value="academicYear" className="rounded-xl">Année scolaire</SelectItem>
                        <SelectItem value="all" className="rounded-xl">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {periodScope !== "all" ? (
                    <>
                      <div>
                        <Label className="text-xs">Period</Label>
                        <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as any)}>
                          <SelectTrigger className="mt-1 h-10 text-xs rounded-2xl glass border-0 shadow-apple">
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent className="glass-strong border-0 shadow-apple-lg rounded-2xl">
                            <SelectItem value="current" className="rounded-xl">Current</SelectItem>
                            <SelectItem value="previous" className="rounded-xl">Previous</SelectItem>
                            <SelectItem value="specific" className="rounded-xl">Specific</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">{periodScope === "mandate" ? "Mandat" : "Année scolaire"}</Label>
                        <Select
                          value={periodMode === "specific" ? specificPeriodId : activePeriodId || ""}
                          onValueChange={(v) => {
                            setPeriodMode("specific")
                            setSpecificPeriodId(v)
                          }}
                        >
                          <SelectTrigger className="mt-1 h-10 text-xs rounded-2xl glass border-0 shadow-apple">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent className="glass-strong border-0 shadow-apple-lg rounded-2xl">
                            {(periodScope === "mandate" ? mandates : academicYears).map((p) => {
                              const start = new Date(p.start_date)
                              const end = new Date(p.end_date)
                              const label = `${p.name} (${start.toLocaleDateString()} → ${end.toLocaleDateString()})`
                              return (
                                <SelectItem key={p.id} value={p.id} className="rounded-xl">
                                  {label}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2 flex items-end">
                      <p className="text-xs text-muted-foreground">Showing all notifications</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-0">
          <TabsList className="h-10 grid grid-cols-3 glass border-0 shadow-apple rounded-2xl p-1">
            <TabsTrigger value="all" className="text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-apple transition-apple">
              All
              <Badge variant="secondary" className="ml-2 text-xs glass border-0">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-apple transition-apple">
              Unread
              <Badge variant="secondary" className="ml-2 text-xs glass border-0">{unreadCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="read" className="text-sm rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-apple transition-apple">
              Read
              <Badge variant="secondary" className="ml-2 text-xs glass border-0">{readCount}</Badge>
            </TabsTrigger>
          </TabsList>
          {filteredNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedNotifications.size > 0 && selectedNotifications.size === filteredNotifications.length}
                onCheckedChange={toggleSelectAllNotifications}
                className="ml-2"
              />
              <Label className="text-xs text-muted-foreground cursor-pointer" onClick={toggleSelectAllNotifications}>
                Select all
              </Label>
            </div>
          )}
        </div>
        
        <TabsContent value="all" className="mt-0 focus-visible:outline-none focus-visible:ring-0 px-0">
          {renderNotificationList()}
          {totalPages > 1 && (
            <div className="mt-6 px-4 sm:px-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredNotifications.length}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0 focus-visible:outline-none focus-visible:ring-0 px-0">
          {renderNotificationList()}
          {totalPages > 1 && (
            <div className="mt-6 px-4 sm:px-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredNotifications.length}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="read" className="mt-0 focus-visible:outline-none focus-visible:ring-0 px-0">
          {renderNotificationList()}
          {totalPages > 1 && (
            <div className="mt-6 px-4 sm:px-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredNotifications.length}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Delete Single Notification Dialog */}
      <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6 glass-strong border-0 rounded-3xl shadow-apple-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Delete Notification
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 text-sm h-9 rounded-2xl glass border-0 shadow-apple">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => notificationToDelete && handleDeleteNotification(notificationToDelete)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm h-9 rounded-2xl shadow-apple hover:shadow-apple-lg border-0 transition-apple"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete All Notifications Dialog */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6 glass-strong border-0 rounded-3xl shadow-apple-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Delete All Notifications
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete all notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 text-sm h-9 rounded-2xl glass border-0 shadow-apple">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllNotifications}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm h-9 rounded-2xl shadow-apple hover:shadow-apple-lg border-0 transition-apple"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  )
} 