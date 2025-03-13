import { supabase } from '@/lib/supabase'
import { 
  successNotification, 
  errorNotification, 
  warningNotification, 
  infoNotification 
} from '@/lib/notifications'

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
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        recipient_type: recipientType,
        title,
        message,
        type,
        link,
        sender_id,
      })
      .select()
      .single()

    if (error) throw error

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