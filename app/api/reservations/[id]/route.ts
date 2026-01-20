import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { Reservation } from '@/models/Reservation'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    const id = params.id
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    // Validate that end_time is after start_time if both are being updated
    if (body.start_time !== undefined && body.end_time !== undefined) {
      const startTime = new Date(body.start_time)
      const endTime = new Date(body.end_time)
      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }
    } else if (body.start_time !== undefined || body.end_time !== undefined) {
      // If only one is being updated, fetch the current reservation to validate
      const currentReservation = await Reservation.findOne({ id }).lean()
      if (currentReservation) {
        const startTime = body.start_time ? new Date(body.start_time) : new Date(currentReservation.start_time)
        const endTime = body.end_time ? new Date(body.end_time) : new Date(currentReservation.end_time)
        if (endTime <= startTime) {
          return NextResponse.json(
            { error: 'End time must be after start time' },
            { status: 400 }
          )
        }
      }
    }

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.start_time !== undefined) updateData.start_time = new Date(body.start_time)
    if (body.end_time !== undefined) updateData.end_time = new Date(body.end_time)
    if (body.space_id !== undefined) updateData.space_id = body.space_id

    const result = await Reservation.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.toObject())
  } catch (error: any) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo();
    const id = params.id

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    const result = await Reservation.findOneAndDelete({ id })

    if (!result) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Reservation deleted successfully' })
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    )
  }
} 