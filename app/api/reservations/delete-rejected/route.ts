import { NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { Reservation } from '@/models/Reservation'

export async function DELETE() {
  try {
    await connectMongo();
    
    const result = await Reservation.deleteMany({ status: 'rejected' })

    return NextResponse.json({ 
      message: 'Rejected reservations deleted successfully',
      deletedCount: result.deletedCount 
    })
  } catch (error) {
    console.error('Error deleting rejected reservations:', error)
    return NextResponse.json(
      { error: 'Failed to delete rejected reservations' },
      { status: 500 }
    )
  }
} 