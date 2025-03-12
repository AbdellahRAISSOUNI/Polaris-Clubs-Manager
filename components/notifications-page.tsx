"use client"

import { useNotifications } from '@/lib/notifications-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDistanceToNow, format } from 'date-fns'
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, MailOpen, Trash2, Filter } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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

const NotificationIcon = ({ type }: { type: string }) => {
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
  
  // Keep filter and tab selection in sync
  useEffect(() => {
    setFilter(activeTab)
  }, [activeTab])
  
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read
    if (filter === 'read') return notification.is_read
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
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`transition-colors overflow-hidden ${
              !notification.is_read 
                ? 'border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                : ''
            }`}
          >
            <div className="p-3 sm:p-4 md:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <NotificationIcon type={notification.type} />
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
        ))}
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
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs h-7 sm:h-8">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-xs sm:text-sm">
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
            onClick={refreshNotifications} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1 sm:gap-2 text-xs h-7 sm:h-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 sm:h-4 sm:w-4"
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
              className="flex items-center gap-1 sm:gap-2 text-xs h-7 sm:h-8"
            >
              <MailOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              Mark all as read
            </Button>
          )}
          
          {notifications.length > 0 && (
            <Button 
              onClick={() => setIsDeleteAllDialogOpen(true)} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1 sm:gap-2 text-xs h-7 sm:h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Delete all
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread' | 'read')} className="w-full">
        <TabsList className="mb-3 sm:mb-4 h-9 sm:h-10 grid grid-cols-3">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{notifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs sm:text-sm">
            Unread
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{unreadCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="read" className="text-xs sm:text-sm">
            Read
            <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{readCount}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {renderNotificationList()}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          {renderNotificationList()}
        </TabsContent>
        
        <TabsContent value="read" className="mt-0">
          {renderNotificationList()}
        </TabsContent>
      </Tabs>
      
      {/* Delete Single Notification Dialog */}
      <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="mt-0 text-xs sm:text-sm h-8 sm:h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => notificationToDelete && handleDeleteNotification(notificationToDelete)}
              className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-10"
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
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete all notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <AlertDialogCancel className="mt-0 text-xs sm:text-sm h-8 sm:h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllNotifications}
              className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-10"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 