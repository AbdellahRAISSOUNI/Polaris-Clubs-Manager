import { connectMongo } from '@/lib/mongodb'
import { Notification } from '@/models/Notification'
import { 
  successNotification, 
  errorNotification, 
  warningNotification, 
  infoNotification 
} from '@/lib/notifications'
import { triggerPusherEvent } from '@/lib/pusher-server'
import { randomUUID } from 'crypto'

interface SendNotificationParams {
  recipientId: string
  recipientType: 'admin' | 'club'
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  link?: string
  sender_id?: string  // Optional field to store the club ID that sent the notification
}

// Helper function to check if code is running in browser
const isBrowser = () => typeof window !== 'undefined'

export async function sendNotification({
  recipientId,
  recipientType,
  title,
  message,
  type,
  link,
  sender_id,
}: SendNotificationParams) {
  try {
    await connectMongo();
    
    const newNotification = new Notification({
      id: randomUUID(),
      recipient_id: recipientId,
      recipient_type: recipientType,
      title,
      message,
      type,
      link: link || '',
      sender_id: sender_id || '',
      is_read: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedNotification = await newNotification.save();
    
    // Transform to match expected format
    const data = {
      id: savedNotification.id,
      recipient_id: savedNotification.recipient_id,
      recipient_type: savedNotification.recipient_type,
      title: savedNotification.title,
      message: savedNotification.message,
      type: savedNotification.type,
      link: savedNotification.link,
      sender_id: savedNotification.sender_id,
      is_read: savedNotification.is_read,
      created_at: savedNotification.created_at ? new Date(savedNotification.created_at).toISOString() : new Date().toISOString(),
      updated_at: savedNotification.updated_at ? new Date(savedNotification.updated_at).toISOString() : new Date().toISOString(),
    };

    // Trigger Pusher event for realtime notification
    const channel = `notifications-${recipientType}-${recipientId}`
    await triggerPusherEvent(channel, 'new-notification', data)

    // Also trigger on a general notifications channel for the user type
    await triggerPusherEvent(`notifications-${recipientType}`, 'new-notification', data)

    // Only attempt to show toast notifications in browser environment
    if (isBrowser()) {
      // Show a toast notification if the recipient is the current user
      const currentAdminId = localStorage.getItem('adminId')
      const currentClubId = localStorage.getItem('clubId')
      const isCurrentUser = recipientId === (recipientType === 'admin' ? currentAdminId : currentClubId)

      if (isCurrentUser) {
        switch (type) {
          case 'success':
            successNotification({ title, description: message })
            break
          case 'error':
            errorNotification({ title, description: message })
            break
          case 'warning':
            warningNotification({ title, description: message })
            break
          case 'info':
            infoNotification({ title, description: message })
            break
        }
      }
    }

    return data
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
} 