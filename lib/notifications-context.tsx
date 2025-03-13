"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('recipient_type', userType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return
    }

    setNotifications(data)
    setUnreadCount(data.filter(n => !n.is_read).length)
  }

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return
    }

    await fetchNotifications()
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('recipient_type', userType)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return
    }

    await fetchNotifications()
  }

  const deleteNotification = async (notificationId: string) => {
    console.log('Attempting to delete notification:', notificationId)
    
    try {
      // Find the notification to delete for UI updates
      const notificationToDelete = notifications.find(n => n.id === notificationId)
      if (!notificationToDelete) {
        console.error('Notification not found in local state:', notificationId)
        return
      }
      
      // Immediately update UI state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (!notificationToDelete.is_read) {
        setUnreadCount(prev => prev - 1)
      }
      
      // Try multiple approaches to delete the notification
      let deleteSuccessful = false
      
      // Approach 1: Use RPC function (preferred if available)
      try {
        console.log('Trying RPC delete_notification function...')
        const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_notification', {
          notification_id: notificationId
        })
        
        if (!rpcError) {
          console.log('Successfully deleted notification via RPC:', rpcResult)
          deleteSuccessful = true
        } else {
          console.error('RPC delete failed:', rpcError.message)
        }
      } catch (rpcError) {
        console.error('RPC function error:', rpcError)
      }
      
      // Approach 2: Standard delete with recipient filters (if RPC failed)
      if (!deleteSuccessful) {
        console.log('Trying standard delete with recipient filters...')
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
          .eq('recipient_id', userId)
          .eq('recipient_type', userType)
        
        if (!deleteError) {
          console.log('Successfully deleted notification via standard delete')
          deleteSuccessful = true
        } else {
          console.error('Standard delete failed:', deleteError.message)
        }
      }
      
      // Approach 3: Simple delete by ID only (last resort)
      if (!deleteSuccessful) {
        console.log('Trying simple delete by ID...')
        const { error: simpleDeleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
        
        if (!simpleDeleteError) {
          console.log('Successfully deleted notification via simple delete')
          deleteSuccessful = true
        } else {
          console.error('Simple delete failed:', simpleDeleteError.message)
        }
      }
      
      // If all approaches failed, restore the original notifications
      if (!deleteSuccessful) {
        console.error('All delete approaches failed, restoring original notifications')
        await fetchNotifications()
      } else {
        // Add a small delay before the final refresh to ensure database consistency
        setTimeout(async () => {
          await fetchNotifications()
        }, 500)
      }
    } catch (e) {
      console.error('Exception when deleting notification:', e)
      // Restore notifications on error
      await fetchNotifications()
    }
  }

  const deleteAllNotifications = async () => {
    console.log('Attempting to delete all notifications for user:', userId, 'type:', userType)
    
    try {
      // First, store the current notifications count for logging
      const initialCount = notifications.length
      
      // Immediately update UI state to show empty notifications
      setNotifications([])
      setUnreadCount(0)
      
      // Try multiple approaches to delete all notifications
      let deleteSuccessful = false
      
      // Approach 1: Use RPC function (preferred if available)
      try {
        console.log('Trying RPC delete_all_notifications function...')
        const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_all_notifications', {
          user_id: userId,
          user_type: userType
        })
        
        if (!rpcError) {
          console.log('Successfully deleted all notifications via RPC:', rpcResult)
          deleteSuccessful = true
        } else {
          console.error('RPC delete_all failed:', rpcError.message)
        }
      } catch (rpcError) {
        console.error('RPC function error:', rpcError)
      }
      
      // Approach 2: Standard delete (if RPC failed)
      if (!deleteSuccessful) {
        console.log('Trying standard delete...')
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('recipient_id', userId)
          .eq('recipient_type', userType)
        
        if (!deleteError) {
          console.log('Successfully deleted all notifications via standard delete')
          deleteSuccessful = true
        } else {
          console.error('Standard delete failed:', deleteError.message)
        }
      }
      
      // If both approaches failed, restore the original notifications
      if (!deleteSuccessful) {
        console.error('All delete approaches failed, restoring original notifications')
        await fetchNotifications()
      } else {
        // If deletion was successful, wait a moment before refreshing to ensure
        // the database has time to process the deletion
        console.log(`Successfully deleted ${initialCount} notifications`)
        
        // Add a small delay before the final refresh to ensure database consistency
        setTimeout(async () => {
          await fetchNotifications()
        }, 500)
      }
    } catch (e) {
      console.error('Exception when deleting all notifications:', e)
      // Restore notifications on error
      await fetchNotifications()
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

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