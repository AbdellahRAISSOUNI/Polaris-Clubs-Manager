import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting reservation:', error)
      throw error
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