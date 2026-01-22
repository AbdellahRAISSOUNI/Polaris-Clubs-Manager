import { NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { Reservation } from '@/models/Reservation'
import { sendNotification } from '@/lib/send-notification'
import { User } from '@/models/User'

export const dynamic = 'force-dynamic'

// PATCH /api/reservations/bulk - Bulk update reservations
export async function PATCH(request: Request) {
  try {
    await connectMongo()
    
    const body = await request.json()
    const { reservationIds, action, status, message } = body

    if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json(
        { error: 'Reservation IDs are required' },
        { status: 400 }
      )
    }

    if (!action || !['approve', 'reject', 'delete', 'status'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, reject, delete, or status' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let newStatus: string

    if (action === 'approve') {
      newStatus = 'approved'
      updateData = { status: 'approved', updated_at: new Date() }
      if (message) {
        updateData.admin_message = message
      }
    } else if (action === 'reject') {
      newStatus = 'rejected'
      updateData = { status: 'rejected', updated_at: new Date() }
      if (message) {
        updateData.admin_message = message
      }
    } else if (action === 'status' && status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
      newStatus = status
      updateData = { status, updated_at: new Date() }
      if (message) {
        updateData.admin_message = message
      }
    } else if (action === 'delete') {
      // Delete reservations
      const result = await Reservation.deleteMany({ id: { $in: reservationIds } })
      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        message: `Successfully deleted ${result.deletedCount} reservation(s)`
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing status' },
        { status: 400 }
      )
    }

    // Update reservations
    const result = await Reservation.updateMany(
      { id: { $in: reservationIds } },
      { $set: updateData }
    )

    // Send notifications to clubs for status changes
    if (action !== 'delete' && (newStatus === 'approved' || newStatus === 'rejected')) {
      const reservations = await Reservation.find({ id: { $in: reservationIds } }).lean()
      
      for (const reservation of reservations) {
        try {
          const notificationMessage = newStatus === 'approved'
            ? `Your reservation "${reservation.title}" has been approved.`
            : `Your reservation "${reservation.title}" has been rejected.${message ? ` Reason: ${message}` : ''}`
          
          await sendNotification({
            recipientId: reservation.club_id,
            recipientType: 'club',
            title: `Reservation ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
            message: notificationMessage,
            type: newStatus === 'approved' ? 'success' : 'error',
            link: `/club/reservations`
          })
        } catch (notifError) {
          console.error(`Error sending notification for reservation ${reservation.id}:`, notifError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `Successfully ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'updated'} ${result.modifiedCount} reservation(s)`
    })
  } catch (error: any) {
    console.error('Error in bulk reservation operation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
