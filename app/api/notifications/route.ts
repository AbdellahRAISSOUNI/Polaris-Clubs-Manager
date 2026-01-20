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

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await Notification.find({
      recipient_id: userId,
      recipient_type: userType,
    })
      .sort({ created_at: -1 })
      .lean()

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications?action=readAll - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'readAll'

    if (action === 'readAll') {
      // Mark all notifications as read
      await Notification.updateMany(
        {
          recipient_id: userId,
          recipient_type: userType,
          is_read: false,
        },
        {
          $set: { is_read: true, updated_at: new Date() },
        }
      )

      // Trigger Pusher event
      const channel = `notifications-${userType}-${userId}`
      await triggerPusherEvent(channel, 'notifications-read-all', { userId, userType })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications?action=all - Delete all notifications
export async function DELETE(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'all' to delete all

    if (action === 'all') {
      // Delete all notifications for user
      await Notification.deleteMany({
        recipient_id: userId,
        recipient_type: userType,
      })

      // Trigger Pusher event
      const channel = `notifications-${userType}-${userId}`
      await triggerPusherEvent(channel, 'notifications-deleted-all', { userId, userType })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
