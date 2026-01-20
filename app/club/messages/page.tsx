"use client"

import React, { useEffect, useState } from 'react'
import { MessagingProvider } from '@/lib/messaging-context'
import { MessagingUI } from '@/components/messaging/MessagingUI'
import { NewConversation } from '@/components/messaging/NewConversation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClubMessagesPage() {
  const [clubId, setClubId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get club ID from local storage
    const storedClubId = localStorage.getItem('clubId')
    if (storedClubId) {
      setClubId(storedClubId)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!clubId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access the messaging system.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 top-16 lg:top-0 lg:left-64 overflow-hidden">
      <MessagingProvider userId={clubId} userType="club">
        <MessagingUI userId={clubId} userType="club" />
      </MessagingProvider>
    </div>
  )
} 