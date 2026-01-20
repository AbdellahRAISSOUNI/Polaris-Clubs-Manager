import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { Notification } from '@/models/Notification'
import { triggerPusherEvent } from '@/lib/pusher-server'

// Helper to get user info from headers
function getUserInfo(request: NextRequest): { userId: string | null; userType: 'admin' | 'club' | null } {
  const userId = request.headers.get('x-user-id')
  const userType = request.headers.get('x-user-type') as 'admin' | 'club' | null
  return { userId, userType }
}

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationId = params.id

    // Mark single notification as read
    const notification = await Notification.findOneAndUpdate(
      {
        id: notificationId,
        recipient_id: userId,
        recipient_type: userType,
      },
      {
        $set: { is_read: true, updated_at: new Date() },
      },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Trigger Pusher event for notification update
    const channel = `notifications-${userType}-${userId}`
    await triggerPusherEvent(channel, 'notification-updated', notification)

    return NextResponse.json(notification)
  } catch (error: any) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationId = params.id

    // Delete single notification
    const result = await Notification.findOneAndDelete({
      id: notificationId,
      recipient_id: userId,
      recipient_type: userType,
    })

    if (!result) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Trigger Pusher event for notification deletion
    const channel = `notifications-${userType}-${userId}`
    await triggerPusherEvent(channel, 'notification-deleted', { id: notificationId })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
