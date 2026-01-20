import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { OnlineStatus } from '@/models/OnlineStatus'
import { triggerPusherEvent } from '@/lib/pusher-server'

// GET /api/messages/online-status - Get all online statuses
export async function GET(request: NextRequest) {
  try {
    await connectToMongo()

    const statuses = await OnlineStatus.find({}).lean()

    const statusMap: Record<string, any> = {}
    statuses.forEach((status) => {
      statusMap[`${status.user_type}-${status.user_id}`] = status
    })

    return NextResponse.json(statusMap)
  } catch (error: any) {
    console.error('Error fetching online statuses:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch online statuses' },
      { status: 500 }
    )
  }
}

// Helper to get user info from headers
function getUserInfo(request: NextRequest): { userId: string | null; userType: 'admin' | 'club' | null } {
  const userId = request.headers.get('x-user-id')
  const userType = request.headers.get('x-user-type') as 'admin' | 'club' | null
  return { userId, userType }
}

// POST /api/messages/online-status - Update online status
export async function POST(request: NextRequest) {
  try {
    await connectToMongo()

    const { userId, userType } = getUserInfo(request)

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_online } = body

    const statusId = `${userType}-${userId}`
    const status = await OnlineStatus.findOneAndUpdate(
      {
        user_id: userId,
        user_type: userType,
      },
      {
        id: statusId,
        user_id: userId,
        user_type: userType,
        is_online: is_online ?? true,
        last_active: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    )

    const statusData = status.toObject()

    // Trigger Pusher event for online status update
    await triggerPusherEvent('online-status', 'status-updated', statusData)

    return NextResponse.json(statusData)
  } catch (error: any) {
    console.error('Error updating online status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update online status' },
      { status: 500 }
    )
  }
}
