"use client"

import { NotificationsPage } from '@/components/notifications-page'
import { getClubId } from '@/lib/storage'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClubNotificationsPage() {
  const [clubId, setClubId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const id = getClubId()
    if (!id) {
      router.push('/login')
      return
    }
    setClubId(id)
  }, [router])

  if (!clubId) {
    return null
  }

  return <NotificationsPage />
} 