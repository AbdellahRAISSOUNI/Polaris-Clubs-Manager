"use client"

import { NotificationsPage } from '@/components/notifications-page'
import { getAdminId } from '@/lib/storage'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin-layout'

export default function AdminNotificationsPage() {
  const [adminId, setAdminId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const id = getAdminId()
    if (!id) {
      router.push('/login')
      return
    }
    setAdminId(id)
  }, [router])

  if (!adminId) {
    return null
  }

  return (
    <AdminLayout>
      <NotificationsPage />
    </AdminLayout>
  )
} 