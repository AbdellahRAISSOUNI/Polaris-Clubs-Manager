import { NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { Space } from '@/models/Space'
import { Reservation } from '@/models/Reservation'

export const dynamic = 'force-dynamic'

// PATCH /api/spaces/bulk - Bulk update spaces
export async function PATCH(request: Request) {
  try {
    await connectMongo()
    
    const body = await request.json()
    const { spaceIds, action } = body

    if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0) {
      return NextResponse.json(
        { error: 'Space IDs are required' },
        { status: 400 }
      )
    }

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: activate or deactivate' },
        { status: 400 }
      )
    }

    const isActive = action === 'activate'

    const result = await Space.updateMany(
      { id: { $in: spaceIds } },
      { $set: { is_active: isActive, updated_at: new Date() } }
    )

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${result.modifiedCount} space(s)`
    })
  } catch (error: any) {
    console.error('Error in bulk space operation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/bulk - Bulk delete spaces
export async function DELETE(request: Request) {
  try {
    await connectMongo()
    
    const body = await request.json()
    const { spaceIds } = body

    if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0) {
      return NextResponse.json(
        { error: 'Space IDs are required' },
        { status: 400 }
      )
    }

    // Check if any spaces have reservations
    const reservations = await Reservation.find({
      space_id: { $in: spaceIds }
    }).lean()

    if (reservations.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete spaces with existing reservations. Found ${reservations.length} reservation(s).` },
        { status: 400 }
      )
    }

    const result = await Space.deleteMany({ id: { $in: spaceIds } })

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} space(s)`
    })
  } catch (error: any) {
    console.error('Error in bulk space delete:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete spaces' },
      { status: 500 }
    )
  }
}
