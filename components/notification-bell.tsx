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

interface NotificationBellProps {
  userType: 'admin' | 'club'
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export function NotificationBell({ userType }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications()
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
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div key={notification.id} className={`px-4 py-3 border-b last:border-b-0 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.is_read ? 'text-black dark:text-white' : ''}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {notification.message.split('\n\n')[0]}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleNotificationClick(notification.id, notification.link)}
                        >
                          {notification.link ? 'View details' : 'Mark as read'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotificationToDelete(notification.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
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