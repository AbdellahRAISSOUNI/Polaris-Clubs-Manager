import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { Notification } from '@/models/Notification'
import { triggerPusherEvent } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

function getUserInfo(request: NextRequest): { userId: string | null; userType: 'admin' | 'club' | null } {
  const userId = request.headers.get('x-user-id')
  const userType = request.headers.get('x-user-type') as 'admin' | 'club' | null
  return { userId, userType }
}

// PATCH /api/notifications/bulk - Bulk update notifications
export async function PATCH(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, action } = body

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      )
    }

    if (!action || !['markRead', 'markUnread', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: markRead, markUnread, or delete' },
        { status: 400 }
      )
    }

    const query = {
      id: { $in: notificationIds },
      recipient_id: userId,
      recipient_type: userType,
    }

    if (action === 'delete') {
      const result = await Notification.deleteMany(query)
      
      // Trigger Pusher event
      const channel = `notifications-${userType}-${userId}`
      await triggerPusherEvent(channel, 'notifications-deleted-bulk', { userId, userType, count: result.deletedCount })

      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `Successfully deleted ${result.deletedCount} notification(s)`
      })
    } else {
      const updateData = action === 'markRead' 
        ? { is_read: true, updated_at: new Date() }
        : { is_read: false, updated_at: new Date() }

      const result = await Notification.updateMany(query, { $set: updateData })

      // Trigger Pusher event
      const channel = `notifications-${userType}-${userId}`
      await triggerPusherEvent(channel, 'notifications-updated-bulk', { userId, userType, action, count: result.modifiedCount })

      return NextResponse.json({
        success: true,
        updatedCount: result.modifiedCount,
        message: `Successfully ${action === 'markRead' ? 'marked as read' : 'marked as unread'} ${result.modifiedCount} notification(s)`
      })
    }
  } catch (error: any) {
    console.error('Error in bulk notification operation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
