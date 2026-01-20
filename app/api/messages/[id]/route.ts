import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { Message } from '@/models/Message'
import { triggerPusherEvent } from '@/lib/pusher-server'

// Helper to get user info from headers
function getUserInfo(request: NextRequest): { userId: string | null; userType: 'admin' | 'club' | null } {
  const userId = request.headers.get('x-user-id')
  const userType = request.headers.get('x-user-type') as 'admin' | 'club' | null
  return { userId, userType }
}

// PATCH /api/messages/[id] - Update message (mark as read, update reactions, delete)
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

    const messageId = params.id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'read', 'react', 'delete'

    const body = await request.json()

    if (action === 'read') {
      // Mark message as read
      const message = await Message.findOne({
        id: messageId,
        recipient_id: userId,
        recipient_type: userType,
      })

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      message.is_read = true
      message.last_read_update = new Date()
      message.updated_at = new Date()
      await message.save()

      const messageData = message.toObject()

      // Trigger Pusher events for both sender and recipient
      const senderChannel = `messages-${message.sender_type}-${message.sender_id}`
      const recipientChannel = `messages-${message.recipient_type}-${message.recipient_id}`
      
      await triggerPusherEvent(senderChannel, 'message-updated', messageData)
      await triggerPusherEvent(recipientChannel, 'message-updated', messageData)

      return NextResponse.json(messageData)
    }

    if (action === 'react') {
      // Update message reactions
      const { emoji } = body
      const reactionKey = `${userType}-${userId}`

      const message = await Message.findOne({ id: messageId })

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      const reactions = message.reactions || {}
      const newReactions = { ...reactions }

      // Toggle reaction
      if (newReactions[reactionKey] === emoji) {
        delete newReactions[reactionKey]
      } else {
        newReactions[reactionKey] = emoji
      }

      message.reactions = newReactions
      message.updated_at = new Date()
      await message.save()

      const messageData = message.toObject()

      // Trigger Pusher events for both sender and recipient
      const senderChannel = `messages-${message.sender_type}-${message.sender_id}`
      const recipientChannel = `messages-${message.recipient_type}-${message.recipient_id}`
      
      await triggerPusherEvent(senderChannel, 'message-updated', messageData)
      await triggerPusherEvent(recipientChannel, 'message-updated', messageData)

      return NextResponse.json(messageData)
    }

    if (action === 'delete') {
      // Soft delete message (only if sender and less than 15 minutes old)
      const message = await Message.findOne({
        id: messageId,
        sender_id: userId,
        sender_type: userType,
      })

      if (!message) {
        return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 })
      }

      const messageTime = new Date(message.created_at).getTime()
      const currentTime = new Date().getTime()
      const fifteenMinutesInMs = 15 * 60 * 1000

      if (currentTime - messageTime > fifteenMinutesInMs) {
        return NextResponse.json(
          { error: 'Cannot delete messages older than 15 minutes' },
          { status: 400 }
        )
      }

      message.is_deleted = true
      message.content = 'This message was deleted'
      message.updated_at = new Date()
      await message.save()

      const messageData = message.toObject()

      // Trigger Pusher events for both sender and recipient
      const senderChannel = `messages-${message.sender_type}-${message.sender_id}`
      const recipientChannel = `messages-${message.recipient_type}-${message.recipient_id}`
      
      await triggerPusherEvent(senderChannel, 'message-updated', messageData)
      await triggerPusherEvent(recipientChannel, 'message-updated', messageData)

      return NextResponse.json(messageData)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update message' },
      { status: 500 }
    )
  }
}
