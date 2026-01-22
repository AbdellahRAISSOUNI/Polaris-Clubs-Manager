import { NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { Club } from '@/models/Club'
import { Reservation } from '@/models/Reservation'

export const dynamic = 'force-dynamic'

// PATCH /api/clubs/bulk - Bulk update clubs
export async function PATCH(request: Request) {
  try {
    await connectMongo()
    
    const body = await request.json()
    const { clubIds, action, status } = body

    if (!clubIds || !Array.isArray(clubIds) || clubIds.length === 0) {
      return NextResponse.json(
        { error: 'Club IDs are required' },
        { status: 400 }
      )
    }

    if (!action || !['activate', 'deactivate', 'status'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: activate, deactivate, or status' },
        { status: 400 }
      )
    }

    let newStatus: 'active' | 'inactive'

    if (action === 'activate') {
      newStatus = 'active'
    } else if (action === 'deactivate') {
      newStatus = 'inactive'
    } else if (action === 'status' && status) {
      if (!['active', 'inactive'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value. Must be: active or inactive' },
          { status: 400 }
        )
      }
      newStatus = status as 'active' | 'inactive'
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing status' },
        { status: 400 }
      )
    }

    const result = await Club.updateMany(
      { id: { $in: clubIds } },
      { $set: { status: newStatus, updated_at: new Date() } }
    )

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `Successfully ${newStatus === 'active' ? 'activated' : 'deactivated'} ${result.modifiedCount} club(s)`
    })
  } catch (error: any) {
    console.error('Error in bulk club operation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

// DELETE /api/clubs/bulk - Bulk delete clubs
export async function DELETE(request: Request) {
  try {
    await connectMongo()
    
    const body = await request.json()
    const { clubIds } = body

    if (!clubIds || !Array.isArray(clubIds) || clubIds.length === 0) {
      return NextResponse.json(
        { error: 'Club IDs are required' },
        { status: 400 }
      )
    }

    // Check if any clubs have active reservations
    const activeReservations = await Reservation.find({
      club_id: { $in: clubIds },
      status: { $in: ['pending', 'approved'] }
    }).lean()

    if (activeReservations.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete clubs with active reservations. Found ${activeReservations.length} active reservation(s).` },
        { status: 400 }
      )
    }

    const result = await Club.deleteMany({ id: { $in: clubIds } })

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} club(s)`
    })
  } catch (error: any) {
    console.error('Error in bulk club delete:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete clubs' },
      { status: 500 }
    )
  }
}
