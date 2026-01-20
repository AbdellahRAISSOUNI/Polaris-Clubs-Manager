import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { Message } from '@/models/Message'
import { triggerPusherEvent } from '@/lib/pusher-server'
import crypto from 'crypto'

// Helper to get user info from headers
function getUserInfo(request: NextRequest): { userId: string | null; userType: 'admin' | 'club' | null } {
  const userId = request.headers.get('x-user-id')
  const userType = request.headers.get('x-user-type') as 'admin' | 'club' | null
  return { userId, userType }
}

// GET /api/messages - Get messages for current user
export async function GET(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationPartnerId = searchParams.get('partnerId')
    const conversationPartnerType = searchParams.get('partnerType') as 'admin' | 'club' | null

    if (conversationPartnerId && conversationPartnerType) {
      // Get messages for a specific conversation
      const messages = await Message.find({
        $or: [
          {
            sender_id: userId,
            sender_type: userType,
            recipient_id: conversationPartnerId,
            recipient_type: conversationPartnerType,
          },
          {
            sender_id: conversationPartnerId,
            sender_type: conversationPartnerType,
            recipient_id: userId,
            recipient_type: userType,
          },
        ],
      })
        .sort({ created_at: 1 })
        .lean()

      return NextResponse.json(messages)
    }

    // Get all messages for the current user
    const messages = await Message.find({
      $or: [
        { sender_id: userId, sender_type: userType },
        { recipient_id: userId, recipient_type: userType },
      ],
    })
      .sort({ created_at: -1 })
      .lean()

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, recipient_type, content, reply_to_id } = body

    if (!recipient_id || !recipient_type || !content) {
      return NextResponse.json(
        { error: 'recipient_id, recipient_type, and content are required' },
        { status: 400 }
      )
    }

    const messageId = crypto.randomUUID()
    const message = await Message.create({
      id: messageId,
      sender_id: userId,
      sender_type: userType,
      recipient_id,
      recipient_type,
      content,
      reply_to_id: reply_to_id || undefined,
      is_read: false,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const messageData = message.toObject()

    // Trigger Pusher events for both sender and recipient
    const senderChannel = `messages-${userType}-${userId}`
    const recipientChannel = `messages-${recipient_type}-${recipient_id}`
    
    await triggerPusherEvent(senderChannel, 'new-message', messageData)
    await triggerPusherEvent(recipientChannel, 'new-message', messageData)
    
    // Also trigger on a general messages channel
    await triggerPusherEvent('messages', 'new-message', messageData)

    return NextResponse.json(messageData, { status: 201 })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}

// PATCH /api/messages?action=readAll - Mark all messages in a conversation as read
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
      const body = await request.json()
      const { partnerId, partnerType } = body

      if (!partnerId || !partnerType) {
        return NextResponse.json(
          { error: 'partnerId and partnerType are required' },
          { status: 400 }
        )
      }

      await Message.updateMany(
        {
          sender_id: partnerId,
          sender_type: partnerType,
          recipient_id: userId,
          recipient_type: userType,
          is_read: false,
        },
        {
          $set: {
            is_read: true,
            last_read_update: new Date(),
            updated_at: new Date(),
          },
        }
      )

      // Trigger Pusher events
      const senderChannel = `messages-${partnerType}-${partnerId}`
      const recipientChannel = `messages-${userType}-${userId}`
      
      await triggerPusherEvent(senderChannel, 'messages-read-all', { partnerId, partnerType, userId, userType })
      await triggerPusherEvent(recipientChannel, 'messages-read-all', { partnerId, partnerType, userId, userType })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error updating messages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update messages' },
      { status: 500 }
    )
  }
}
