"use client"

import { useNotifications } from '@/lib/notifications-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow, format } from 'date-fns'
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, MailOpen, Trash2, Filter } from 'lucide-react'
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
  }, [activeTab])
  
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
        <Card className="p-6 sm:p-8 text-center">
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
      )
    }
    
    return (
      <div className="space-y-3 sm:space-y-4">
        {filteredNotifications.map((notification) => {
          const isSelected = selectedNotifications.has(notification.id)
          return (
            <Card
              key={notification.id}
              className={`transition-colors overflow-hidden ${
                !notification.is_read 
                  ? 'border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                  : ''
              } ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
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
                        className="whitespace-nowrap text-xs"
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs h-7 sm:h-8 flex-1 sm:flex-auto"
                        >
                          <MailOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNotificationToDelete(notification.id)}
                        className="text-xs h-7 sm:h-8 text-red-500 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-auto"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-4 max-w-4xl">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
            Stay updated with important information
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 self-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-sm h-9">
                <Filter className="h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-sm">
              <DropdownMenuItem onClick={() => { setFilter('all'); setActiveTab('all'); }}>
                All notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFilter('unread'); setActiveTab('unread'); }}>
                Unread only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setFilter('read'); setActiveTab('read'); }}>
                Read only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm h-9"
            title="Toggle period filters"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Period</span>
          </Button>
          
          <Button 
            onClick={refreshNotifications} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1.5 text-sm h-9"
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
          
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1.5 text-sm h-9"
            >
              <MailOpen className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
          
          {notifications.length > 0 && (
            <Button 
              onClick={() => setIsDeleteAllDialogOpen(true)} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1.5 text-sm h-9 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete all
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedNotifications.size > 0 && (
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3 mb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {selectedNotifications.size} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNotifications(new Set())}
              className="h-7 sm:h-8 text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkNotificationAction('markRead')}
              disabled={isBulkActionLoading}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              {isBulkActionLoading ? (
                <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
              ) : (
                <MailOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              Mark as read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkNotificationAction('markUnread')}
              disabled={isBulkActionLoading}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              {isBulkActionLoading ? (
                <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
              ) : (
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              Mark as unread
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${selectedNotifications.size} notification(s)? This action cannot be undone.`)) {
                  handleBulkNotificationAction('delete')
                }
              }}
              disabled={isBulkActionLoading}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              {isBulkActionLoading ? (
                <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
              ) : (
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Period filter - Collapsible */}
      {showFilters && (
        <Card className="mb-4 sm:mb-6 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandate">Mandat ADE</SelectItem>
                    <SelectItem value="academicYear">Année scolaire</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodScope !== "all" ? (
                <>
                  <div>
                    <Label className="text-xs">Period</Label>
                    <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as any)}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="previous">Previous</SelectItem>
                        <SelectItem value="specific">Specific</SelectItem>
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
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(periodScope === "mandate" ? mandates : academicYears).map((p) => {
                          const start = new Date(p.start_date)
                          const end = new Date(p.end_date)
                          const label = `${p.name} (${start.toLocaleDateString()} → ${end.toLocaleDateString()})`
                          return (
                            <SelectItem key={p.id} value={p.id}>
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
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-10 grid grid-cols-3 sticky top-0 bg-background z-10">
            <TabsTrigger value="all" className="text-sm">
              All
              <Badge variant="secondary" className="ml-2 text-xs">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-sm">
              Unread
              <Badge variant="secondary" className="ml-2 text-xs">{unreadCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="read" className="text-sm">
              Read
              <Badge variant="secondary" className="ml-2 text-xs">{readCount}</Badge>
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
        
        <TabsContent value="all" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {renderNotificationList()}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {renderNotificationList()}
        </TabsContent>
        
        <TabsContent value="read" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {renderNotificationList()}
        </TabsContent>
      </Tabs>
      
      {/* Delete Single Notification Dialog */}
      <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 text-sm h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => notificationToDelete && handleDeleteNotification(notificationToDelete)}
              className="bg-red-500 hover:bg-red-600 text-sm h-9"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete All Notifications Dialog */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete All Notifications</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete all notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 text-sm h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllNotifications}
              className="bg-red-500 hover:bg-red-600 text-sm h-9"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 