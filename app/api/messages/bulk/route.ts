import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { Message } from '@/models/Message'
import { triggerPusherEvent } from '@/lib/pusher-server'

export const dynamic = 'force-dynamic'

function getUserInfo(request: NextRequest): { userId: string | null; userType: 'admin' | 'club' | null } {
  const userId = request.headers.get('x-user-id')
  const userType = request.headers.get('x-user-type') as 'admin' | 'club' | null
  return { userId, userType }
}

// PATCH /api/messages/bulk - Bulk update messages
export async function PATCH(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageIds, action } = body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      )
    }

    if (!action || !['markRead', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: markRead or delete' },
        { status: 400 }
      )
    }

    // Ensure user can only modify their own messages or messages sent to them
    const query: any = {
      id: { $in: messageIds },
      $or: [
        { sender_id: userId, sender_type: userType },
        { recipient_id: userId, recipient_type: userType },
      ],
    }

    if (action === 'delete') {
      // Soft delete by marking as deleted
      const result = await Message.updateMany(
        query,
        { $set: { is_deleted: true, updated_at: new Date() } }
      )

      // Trigger Pusher events
      const channel = `messages-${userType}-${userId}`
      await triggerPusherEvent(channel, 'messages-deleted-bulk', { userId, userType, count: result.modifiedCount })

      return NextResponse.json({
        success: true,
        deletedCount: result.modifiedCount,
        message: `Successfully deleted ${result.modifiedCount} message(s)`
      })
    } else {
      // Mark as read (only messages sent to the user)
      const readQuery = {
        id: { $in: messageIds },
        recipient_id: userId,
        recipient_type: userType,
        is_read: false,
      }

      const result = await Message.updateMany(
        readQuery,
        { $set: { is_read: true, updated_at: new Date() } }
      )

      // Trigger Pusher events
      const channel = `messages-${userType}-${userId}`
      await triggerPusherEvent(channel, 'messages-read-bulk', { userId, userType, count: result.modifiedCount })

      return NextResponse.json({
        success: true,
        updatedCount: result.modifiedCount,
        message: `Successfully marked ${result.modifiedCount} message(s) as read`
      })
    }
  } catch (error: any) {
    console.error('Error in bulk message operation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
