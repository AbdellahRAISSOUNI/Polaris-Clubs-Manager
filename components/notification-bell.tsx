"use client"

import { Bell, Trash2 } from 'lucide-react'
import { useNotifications } from '@/lib/notifications-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
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

interface NotificationBellProps {
  userType: 'admin' | 'club'
}

const NotificationIcon = ({ type, senderId }: { type: string, senderId?: string }) => {
  if (senderId) {
    return (
      <Avatar className="h-6 w-6">
        <AvatarImage 
          src={`/api/clubs/${senderId}/image`}
          alt="Club logo"
        />
        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">
          C
        </AvatarFallback>
      </Avatar>
    )
  }

  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    case 'info':
      return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    default:
      return <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  }
}

export function NotificationBell({ userType }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)

  const handleViewAll = () => {
    router.push(`/${userType}/notifications`)
    setIsOpen(false)
  }

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId)
    if (link) {
      router.push(link)
    }
    setIsOpen(false)
  }

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId)
    setNotificationToDelete(null)
  }
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setIsOpen(false)
  }

  // Get the 5 most recent notifications
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[300px] p-0">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.is_read ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                >
                  <div className="flex gap-2 w-full">
                    <div className="flex-shrink-0 mt-0.5">
                      <NotificationIcon type={notification.type} senderId={notification.sender_id} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.title}
                        </p>
                        <div className="flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
          
          <DropdownMenuSeparator />
          <div className="p-2 text-center">
            <Button variant="outline" size="sm" className="w-full" onClick={handleViewAll}>
              View all notifications
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Notification Dialog */}
      <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => notificationToDelete && handleDeleteNotification(notificationToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 