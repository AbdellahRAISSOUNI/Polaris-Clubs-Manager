"use client"

import React, { useEffect, useState } from 'react'
import { MessagingProvider } from '@/lib/messaging-context'
import { MessagingUI } from '@/components/messaging/MessagingUI'
import { NewConversation } from '@/components/messaging/NewConversation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminLayout } from '@/components/admin-layout'

export default function AdminMessagesPage() {
  const [adminId, setAdminId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get admin ID from local storage
    const storedAdminId = localStorage.getItem('adminId')
    if (storedAdminId) {
      setAdminId(storedAdminId)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!adminId) {
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
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] -mx-6">
        <MessagingProvider userId={adminId} userType="admin">
          <MessagingUI userId={adminId} userType="admin" />
        </MessagingProvider>
      </div>
    </AdminLayout>
  )
} 