"use client"

import React, { useEffect, useState } from 'react'
import { useMessaging } from '@/lib/messaging-context'
import { Badge } from '@/components/ui/badge'

interface MessageIndicatorProps {
  userId: string
  userType: 'admin' | 'club'
}

export function MessageIndicator({ userId, userType }: MessageIndicatorProps) {
  const { messages } = useMessaging()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Count unread messages
    const count = messages.filter(msg => 
      msg.recipient_id === userId && 
      msg.recipient_type === userType && 
      !msg.is_read
    ).length
    
    setUnreadCount(count)
  }, [messages, userId, userType])

  if (unreadCount === 0) {
    return null
  }

  return (
    <Badge variant="destructive" className="ml-2">
      {unreadCount}
    </Badge>
  )
} 