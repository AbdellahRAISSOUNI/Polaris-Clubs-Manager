"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getPusherClient } from '@/lib/pusher-client'

export interface Notification {
  id: string
  recipient_id: string
  recipient_type: 'admin' | 'club'
  sender_id?: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  is_read: boolean
  link?: string
  created_at: string
  updated_at: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children, userId, userType }: { children: React.ReactNode, userId: string, userType: 'admin' | 'club' }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications?action=readAll', {
        method: 'PATCH',
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      // Optimistically update UI
      const notificationToDelete = notifications.find(n => n.id === notificationId)
      if (notificationToDelete) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        if (!notificationToDelete.is_read) {
          setUnreadCount(prev => prev - 1)
        }
      }

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Refresh to ensure consistency
      await fetchNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
      // Restore on error
      await fetchNotifications()
    }
  }

  const deleteAllNotifications = async () => {
    try {
      // Optimistically update UI
      setNotifications([])
      setUnreadCount(0)

      const response = await fetch('/api/notifications?action=all', {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete all notifications')
      }

      // Refresh to ensure consistency
      await fetchNotifications()
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      // Restore on error
      await fetchNotifications()
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Set up Pusher subscription for realtime notifications
    const pusher = getPusherClient()
    const channel = pusher.subscribe(`notifications-${userType}-${userId}`)

    channel.bind('new-notification', () => {
      fetchNotifications()
    })

    channel.bind('notification-updated', () => {
      fetchNotifications()
    })

    channel.bind('notification-deleted', () => {
      fetchNotifications()
    })

    channel.bind('notifications-read-all', () => {
      fetchNotifications()
    })

    channel.bind('notifications-deleted-all', () => {
      fetchNotifications()
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [userId, userType])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        deleteNotification,
        deleteAllNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
} 